import crypto from 'node:crypto';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { ApiError } from '../utils/ApiError.js';
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  generateOpaqueToken,
} from '../utils/tokens.js';
import { config } from '../config/index.js';
import { ROLES } from '../config/constants.js';
import { sendTemplatedEmail } from '../integrations/email/index.js';
import { logger } from '../config/logger.js';
import { syncUserBadges } from './verification.badges.js';
import { virtualCardService } from './virtualCard.service.js';

const REFRESH_MS = 7 * 24 * 60 * 60 * 1000;

// In-memory single-use token store for email verify / password reset.
// (Persisted to a collection in a later phase; sufficient + simple for Phase 1.)
const singleUseTokens = new Map(); // hash -> { userId, type, expiresAt }

function issueSingleUse(userId, type, ttlMs) {
  const { raw, hash } = generateOpaqueToken();
  singleUseTokens.set(hash, { userId: String(userId), type, expiresAt: Date.now() + ttlMs });
  return raw;
}

function consumeSingleUse(raw, type) {
  const hash = hashToken(raw);
  const entry = singleUseTokens.get(hash);
  if (!entry || entry.type !== type || entry.expiresAt < Date.now()) return null;
  singleUseTokens.delete(hash);
  return entry.userId;
}

async function issueRefreshToken(user, { family, meta = {} } = {}) {
  const { raw, hash } = generateRefreshToken();
  await RefreshToken.create({
    user: user._id,
    tokenHash: hash,
    family: family || crypto.randomUUID(),
    expiresAt: new Date(Date.now() + REFRESH_MS),
    userAgent: meta.userAgent || '',
    ip: meta.ip || '',
  });
  return raw;
}

function authPayload(user, accessToken) {
  return { user: user.toJSON(), accessToken };
}

export const authService = {
  async register({ name, email, password, role }, meta) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) throw ApiError.conflict('Email already registered');

    const chosenRole = role === ROLES.CLIENT ? ROLES.CLIENT : ROLES.FREELANCER;
    const user = new User({ name, email, role: chosenRole, roles: [chosenRole] });
    await user.setPassword(password);
    await user.save();
    if (chosenRole === ROLES.FREELANCER) await virtualCardService.ensureForUser(user);

    // Fire-and-log verification email (mocked in dev).
    const verifyRaw = issueSingleUse(user._id, 'verify_email', 24 * 60 * 60 * 1000);
    const verifyUrl = `${config.clientUrl}/verify-email?token=${verifyRaw}`;
    sendTemplatedEmail('welcome', user.email, { name: user.name, verifyUrl }).catch((e) =>
      logger.warn({ e }, 'welcome email failed')
    );

    const accessToken = signAccessToken(user);
    const refreshToken = await issueRefreshToken(user, { meta });
    return { ...authPayload(user, accessToken), refreshToken, devVerifyToken: config.isProd ? undefined : verifyRaw };
  },

  async login({ email, password }, meta) {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) throw ApiError.unauthorized('Invalid credentials');
    const okPass = await user.comparePassword(password);
    if (!okPass) throw ApiError.unauthorized('Invalid credentials');
    if (user.status === 'banned') throw ApiError.forbidden('Account banned');
    if (user.status === 'deleted') throw ApiError.unauthorized('Account deleted');

    user.lastActiveAt = new Date();
    await user.save();

    const accessToken = signAccessToken(user);
    const refreshToken = await issueRefreshToken(user, { meta });
    return { ...authPayload(user, accessToken), refreshToken };
  },

  /** Rotate refresh token; detect reuse of an already-rotated token. */
  async refresh(rawToken, meta) {
    if (!rawToken) throw ApiError.unauthorized('Missing refresh token');
    const tokenHash = hashToken(rawToken);
    const stored = await RefreshToken.findOne({ tokenHash });

    if (!stored) throw ApiError.unauthorized('Invalid refresh token');
    if (stored.expiresAt < new Date()) throw ApiError.unauthorized('Refresh token expired');

    if (stored.revoked) {
      // Reuse detected — revoke the whole family (possible theft).
      await RefreshToken.updateMany({ family: stored.family }, { revoked: true });
      logger.warn({ family: stored.family }, 'Refresh token reuse detected — family revoked');
      throw ApiError.unauthorized('Refresh token reuse detected');
    }

    const user = await User.findById(stored.user);
    if (!user) throw ApiError.unauthorized('Account not found');

    const { raw: newRaw, hash: newHash } = generateRefreshToken();
    stored.revoked = true;
    stored.replacedByHash = newHash;
    await stored.save();
    await RefreshToken.create({
      user: user._id,
      tokenHash: newHash,
      family: stored.family,
      expiresAt: new Date(Date.now() + REFRESH_MS),
      userAgent: meta?.userAgent || '',
      ip: meta?.ip || '',
    });

    const accessToken = signAccessToken(user);
    return { ...authPayload(user, accessToken), refreshToken: newRaw };
  },

  async logout(rawToken) {
    if (!rawToken) return;
    await RefreshToken.updateOne({ tokenHash: hashToken(rawToken) }, { revoked: true });
  },

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) throw ApiError.notFound('User not found');
    const okPass = await user.comparePassword(currentPassword);
    if (!okPass) throw ApiError.badRequest('Current password is incorrect');
    await user.setPassword(newPassword);
    await user.save();
    // Invalidate all sessions on password change.
    await RefreshToken.updateMany({ user: user._id }, { revoked: true });
  },

  async forgotPassword(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    // Always behave the same to avoid account enumeration.
    if (!user) return { devResetToken: undefined };
    const raw = issueSingleUse(user._id, 'reset_password', 60 * 60 * 1000);
    const resetUrl = `${config.clientUrl}/reset-password?token=${raw}`;
    sendTemplatedEmail('resetPassword', user.email, { resetUrl }).catch(() => {});
    return { devResetToken: config.isProd ? undefined : raw };
  },

  async resetPassword({ token, newPassword }) {
    const userId = consumeSingleUse(token, 'reset_password');
    if (!userId) throw ApiError.badRequest('Invalid or expired reset token');
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) throw ApiError.notFound('User not found');
    await user.setPassword(newPassword);
    await user.save();
    await RefreshToken.updateMany({ user: user._id }, { revoked: true });
  },

  async verifyEmail(token) {
    const userId = consumeSingleUse(token, 'verify_email');
    if (!userId) throw ApiError.badRequest('Invalid or expired verification token');
    await User.updateOne({ _id: userId }, { emailVerified: true });
    // Refresh denormalized trust badges now that email is confirmed.
    await syncUserBadges(userId).catch((e) => logger.warn({ e }, 'badge sync after email verify failed'));
  },

  /** Re-issue an email verification link (idempotent-ish; no-op if already verified). */
  async resendEmailVerification(userId) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    if (user.emailVerified) throw ApiError.badRequest('Email is already verified');
    const raw = issueSingleUse(user._id, 'verify_email', 24 * 60 * 60 * 1000);
    const verifyUrl = `${config.clientUrl}/verify-email?token=${raw}`;
    sendTemplatedEmail('verifyEmail', user.email, { verifyUrl }).catch((e) =>
      logger.warn({ e }, 'verify email resend failed')
    );
    return { sent: true, devVerifyToken: config.isProd ? undefined : raw };
  },

  async deleteAccount(userId) {
    await User.updateOne({ _id: userId }, { status: 'deleted' });
    await RefreshToken.updateMany({ user: userId }, { revoked: true });
  },
};
