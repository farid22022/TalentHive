import { FreelancerProfile } from '../models/FreelancerProfile.js';
import { User } from '../models/User.js';
import { ROLES, USER_STATUS } from '../config/constants.js';
import { storage } from '../integrations/storage/index.js';
import { ApiError } from '../utils/ApiError.js';

// Core scalar fields a client may set directly on the profile.
const CORE_FIELDS = ['title', 'overview', 'category', 'hourlyRate', 'availability', 'skills', 'languages', 'location', 'links', 'visibility'];
// Repeatable array sections.
const SECTION_FIELDS = ['education', 'experience', 'certifications', 'portfolio'];

/** Ensure the caller can own a freelancer profile, and grant the freelancer role if missing. */
async function ensureFreelancer(user) {
  if (!user.hasRole(ROLES.FREELANCER)) {
    user.roles = Array.from(new Set([...(user.roles || []), ROLES.FREELANCER]));
    await user.save();
  }
}

/** Get the caller's profile, creating an empty one on first access. */
async function getOrCreate(user) {
  let profile = await FreelancerProfile.findOne({ user: user._id });
  if (!profile) {
    await ensureFreelancer(user);
    profile = await FreelancerProfile.create({ user: user._id });
  }
  return profile;
}

function applyPatch(profile, patch) {
  for (const key of [...CORE_FIELDS, ...SECTION_FIELDS]) {
    if (patch[key] === undefined) continue;
    if (key === 'location' || key === 'links') {
      profile[key] = { ...profile[key]?.toObject?.(), ...patch[key] };
    } else {
      profile[key] = patch[key];
    }
  }
}

export const profileService = {
  async getMine(user) {
    const profile = await getOrCreate(user);
    return profile;
  },

  async updateMine(user, patch) {
    const profile = await getOrCreate(user);
    applyPatch(profile, patch);
    await profile.save();
    return profile;
  },

  async completeOnboarding(user, patch) {
    const profile = await getOrCreate(user);
    applyPatch(profile, patch);
    profile.onboardingCompleted = true;
    // Default new profiles to public on completing onboarding, unless the user chose private.
    if (patch.visibility === undefined) profile.visibility = 'public';
    await profile.save();
    return profile;
  },

  async uploadAvatar(user, file) {
    if (!file) throw ApiError.badRequest('No image uploaded');
    const result = await storage.uploadImage(file.buffer, { filename: file.originalname });
    user.avatar = result.url;
    await user.save();
    return { avatar: user.avatar, provider: result.provider };
  },

  async uploadCV(user, file) {
    if (!file) throw ApiError.badRequest('No document uploaded');
    const profile = await getOrCreate(user);
    const result = await storage.uploadDocument(file.buffer, { filename: file.originalname });
    profile.cv = {
      url: result.url,
      filename: file.originalname,
      provider: result.provider,
      path: result.path || '',
      uploadedAt: new Date(),
    };
    await profile.save();
    return profile;
  },

  async removeCV(user) {
    const profile = await getOrCreate(user);
    profile.cv = undefined;
    await profile.save();
    return profile;
  },

  /** Public profile by user id — only visible for public profiles of active users. */
  async getPublic(userId) {
    const profile = await FreelancerProfile.findOne({ user: userId, visibility: 'public' }).populate(
      'user',
      'name avatar role status lastActiveAt createdAt'
    );
    if (!profile || !profile.user || profile.user.status !== USER_STATUS.ACTIVE) {
      throw ApiError.notFound('Profile not found');
    }
    return profile;
  },

  /** Public talent directory with basic search + filters. */
  async listPublic({ q, category, skills, availability, minRate, maxRate, sort, page, limit, skip }) {
    const filter = { visibility: 'public' };
    if (category) filter.category = category;
    if (availability) filter.availability = availability;
    if (skills?.length) filter.skills = { $all: skills };
    if (minRate != null || maxRate != null) {
      filter.hourlyRate = {};
      if (minRate != null) filter.hourlyRate.$gte = minRate;
      if (maxRate != null) filter.hourlyRate.$lte = maxRate;
    }
    if (q) filter.$text = { $search: q };

    const sortMap = {
      recent: { updatedAt: -1 },
      rate_asc: { hourlyRate: 1 },
      rate_desc: { hourlyRate: -1 },
      complete: { completeness: -1 },
    };
    const sortSpec = q ? { score: { $meta: 'textScore' } } : sortMap[sort] || { completeness: -1, updatedAt: -1 };

    const query = FreelancerProfile.find(filter)
      .populate('user', 'name avatar status')
      .sort(sortSpec)
      .skip(skip)
      .limit(limit);
    if (q) query.select({ score: { $meta: 'textScore' } });

    const [items, total] = await Promise.all([query.exec(), FreelancerProfile.countDocuments(filter)]);
    // Drop profiles whose user became inactive/deleted.
    const visible = items.filter((p) => p.user && p.user.status === USER_STATUS.ACTIVE);
    return { items: visible, total };
  },

  /** Resolve the local file for an authorized CV/document download. */
  async resolveOwnedDocument(kind, name) {
    return storage.resolveLocal(kind, name);
  },
};
