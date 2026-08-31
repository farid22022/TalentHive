import { User } from '../models/User.js';
import { FreelancerProfile } from '../models/FreelancerProfile.js';
import { VerificationRequest } from '../models/VerificationRequest.js';
import {
  BADGES,
  VERIFICATION_TYPE,
  VERIFICATION_REQUEST_STATUS,
  VERIFICATION_STATE,
} from '../config/constants.js';

/**
 * Derive the trust-badge list + headline verification state for a user from their
 * current signals. Pure — takes the user doc and the set of approved request types.
 * The state is only ever elevated by admin approval, never by AI (guardrail: AI is advisory).
 */
export function deriveBadges(user, approvedTypes = []) {
  const approved = new Set(approvedTypes);
  const badges = [];
  if (user?.emailVerified) badges.push(BADGES.EMAIL);
  if (user?.phoneVerified) badges.push(BADGES.PHONE);
  if (approved.has(VERIFICATION_TYPE.IDENTITY)) badges.push(BADGES.IDENTITY);
  if (approved.has(VERIFICATION_TYPE.DOCUMENT)) badges.push(BADGES.DOCUMENT);

  let state = VERIFICATION_STATE.UNVERIFIED;
  if (approved.has(VERIFICATION_TYPE.IDENTITY)) {
    state = VERIFICATION_STATE.VERIFIED;
    badges.push(BADGES.VERIFIED);
  } else if (approved.has(VERIFICATION_TYPE.DOCUMENT)) {
    state = VERIFICATION_STATE.DOCUMENT_VERIFIED;
  }
  return { badges, state };
}

/** Load the types of a user's currently-approved verification requests. */
export async function approvedTypesFor(userId) {
  return VerificationRequest.find({
    user: userId,
    status: VERIFICATION_REQUEST_STATUS.APPROVED,
  }).distinct('type');
}

/**
 * Recompute and persist the denormalized badges + verificationState onto the user's
 * freelancer profile (the public-facing cache). No-op when the user has no freelancer
 * profile (e.g. clients) — their user-level email/phone flags still reflect status.
 * Returns the derived { badges, state } regardless.
 */
export async function syncUserBadges(userId) {
  const [user, approved] = await Promise.all([User.findById(userId), approvedTypesFor(userId)]);
  const derived = deriveBadges(user, approved);

  const profile = await FreelancerProfile.findOne({ user: userId });
  if (profile) {
    profile.badges = derived.badges;
    profile.verificationState = derived.state;
    await profile.save();
  }
  return derived;
}
