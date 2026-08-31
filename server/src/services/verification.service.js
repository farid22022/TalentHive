import crypto from 'node:crypto';
import { User } from '../models/User.js';
import { VerificationRequest } from '../models/VerificationRequest.js';
import { ApiError } from '../utils/ApiError.js';
import { storage } from '../integrations/storage/index.js';
import { sendSms } from '../integrations/sms/index.js';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';
import {
  VERIFICATION_TYPE,
  VERIFICATION_REQUEST_STATUS,
  VERIFICATION_LIMITS,
} from '../config/constants.js';
import { deriveBadges, approvedTypesFor, syncUserBadges } from './verification.badges.js';

// In-memory single-use phone OTP store: userId -> { codeHash, phone, expiresAt, attempts }.
// (Mirrors auth.service's single-use token approach; persisted to a collection in Phase 15.)
const phoneCodes = new Map();

function hashCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

function generateOtp() {
  const max = 10 ** VERIFICATION_LIMITS.OTP_LENGTH;
  const n = crypto.randomInt(0, max);
  return String(n).padStart(VERIFICATION_LIMITS.OTP_LENGTH, '0');
}

const IDENTITY = VERIFICATION_TYPE.IDENTITY;
const DOCUMENT = VERIFICATION_TYPE.DOCUMENT;
const { PENDING, APPROVED, REJECTED, CANCELLED } = VERIFICATION_REQUEST_STATUS;

export const verificationService = {
  /** Owner-facing verification summary: signals, derived badges, and open requests. */
  async getStatus(user) {
    const approved = await approvedTypesFor(user._id);
    const { badges, state } = deriveBadges(user, approved);
    const requests = await VerificationRequest.find({ user: user._id }).sort({ createdAt: -1 }).limit(20);
    return {
      emailVerified: !!user.emailVerified,
      phoneVerified: !!user.phoneVerified,
      phone: user.phone || '',
      verificationState: state,
      badges,
      requests: requests.map((r) => r.toJSON()),
    };
  },

  // --- Phone verification (self-serve OTP) ---

  async sendPhoneCode(user, { phone } = {}) {
    const number = (phone || user.phone || '').trim();
    if (!number) throw ApiError.badRequest('A phone number is required');
    if (user.phone !== number || user.phoneVerified) {
      // New/changed number resets verified status until confirmed.
      user.phone = number;
      user.phoneVerified = false;
      await user.save();
    }

    const code = generateOtp();
    phoneCodes.set(String(user._id), {
      codeHash: hashCode(code),
      phone: number,
      expiresAt: Date.now() + VERIFICATION_LIMITS.OTP_TTL_MS,
      attempts: 0,
    });

    sendSms(number, `Your TalentHive verification code is ${code}. It expires in 10 minutes.`).catch((e) =>
      logger.warn({ e }, 'phone code SMS failed')
    );

    // Expose the code in non-prod so dev/tests can complete the flow without a real SMS gateway.
    return { sent: true, devCode: config.isProd ? undefined : code };
  },

  async verifyPhoneCode(user, { code }) {
    const key = String(user._id);
    const entry = phoneCodes.get(key);
    if (!entry || entry.expiresAt < Date.now()) {
      phoneCodes.delete(key);
      throw ApiError.badRequest('No active code — request a new one');
    }
    if (entry.attempts >= VERIFICATION_LIMITS.OTP_MAX_ATTEMPTS) {
      phoneCodes.delete(key);
      throw ApiError.badRequest('Too many attempts — request a new code');
    }
    if (hashCode(code) !== entry.codeHash) {
      entry.attempts += 1;
      throw ApiError.badRequest('Incorrect code');
    }

    phoneCodes.delete(key);
    user.phone = entry.phone;
    user.phoneVerified = true;
    await user.save();
    await syncUserBadges(user._id);
    return { phoneVerified: true };
  },

  // --- Identity / document requests (admin-reviewed) ---

  async submitRequest(user, { type, note }, files = []) {
    if (![IDENTITY, DOCUMENT].includes(type)) throw ApiError.badRequest('Invalid verification type');
    if (!files.length) throw ApiError.badRequest('At least one supporting document is required');

    const existing = await VerificationRequest.findOne({ user: user._id, type, status: PENDING });
    if (existing) throw ApiError.conflict('You already have a pending request of this type');

    const documents = [];
    for (const file of files.slice(0, VERIFICATION_LIMITS.DOCS_MAX)) {
      const stored = await storage.uploadDocument(file.buffer, { filename: file.originalname });
      documents.push({
        url: stored.url,
        filename: file.originalname,
        provider: stored.provider,
        path: stored.path || '',
        uploadedAt: new Date(),
      });
    }

    const reqDoc = await VerificationRequest.create({
      user: user._id,
      type,
      note: note || '',
      documents,
      status: PENDING,
    });
    return reqDoc;
  },

  async myRequests(user) {
    const requests = await VerificationRequest.find({ user: user._id }).sort({ createdAt: -1 });
    return requests;
  },

  async cancelRequest(user, id) {
    const reqDoc = await VerificationRequest.findOne({ _id: id, user: user._id });
    if (!reqDoc) throw ApiError.notFound('Request not found');
    if (reqDoc.status !== PENDING) throw ApiError.badRequest('Only pending requests can be cancelled');
    reqDoc.status = CANCELLED;
    await reqDoc.save();
    return reqDoc;
  },

  // --- Admin queue ---

  async listQueue({ status, type, page, limit, skip }) {
    const filter = {};
    if (status) filter.status = status;
    else filter.status = PENDING; // default to the actionable queue
    if (type) filter.type = type;

    const [items, total] = await Promise.all([
      VerificationRequest.find(filter)
        .populate('user', 'name email avatar role')
        .sort({ createdAt: 1 }) // oldest first — FIFO review
        .skip(skip)
        .limit(limit),
      VerificationRequest.countDocuments(filter),
    ]);
    return { items, total };
  },

  async getRequestForAdmin(id) {
    const reqDoc = await VerificationRequest.findById(id).populate(
      'user',
      'name email avatar role phone emailVerified phoneVerified'
    );
    if (!reqDoc) throw ApiError.notFound('Request not found');
    return reqDoc;
  },

  /**
   * Approve or reject a pending request. Approval elevates the applicant's badges +
   * verificationState via the badge pipeline. Human-driven only — never automated.
   */
  async decide(admin, id, { decision, reviewNote }) {
    const reqDoc = await VerificationRequest.findById(id);
    if (!reqDoc) throw ApiError.notFound('Request not found');
    if (reqDoc.status !== PENDING) throw ApiError.badRequest('Request has already been reviewed');

    reqDoc.status = decision === 'approve' ? APPROVED : REJECTED;
    reqDoc.reviewNote = reviewNote || '';
    reqDoc.reviewedBy = admin._id;
    reqDoc.reviewedAt = new Date();
    await reqDoc.save();

    // Recompute the applicant's badges from all their approved requests.
    await syncUserBadges(reqDoc.user);
    logger.info(
      { request: String(reqDoc._id), user: String(reqDoc.user), decision, admin: String(admin._id) },
      'verification decision recorded'
    );
    return reqDoc;
  },
};

/** Test-only hook to clear the in-memory OTP store between runs. */
export function _resetPhoneCodes() {
  phoneCodes.clear();
}
