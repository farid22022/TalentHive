import { Job } from '../models/Job.js';
import { SavedJob } from '../models/SavedJob.js';
import { ROLES, JOB_STATUS } from '../config/constants.js';
import { ApiError } from '../utils/ApiError.js';

// Fields a client may set on create/update.
const WRITABLE = ['title', 'description', 'category', 'skills', 'budget', 'experienceLevel', 'duration', 'status'];

const CLIENT_POPULATE = ['client', 'name avatar role status'];

/** Ensure the caller can own jobs, granting the client role if missing. */
async function ensureClient(user) {
  if (!user.hasRole(ROLES.CLIENT)) {
    user.roles = Array.from(new Set([...(user.roles || []), ROLES.CLIENT]));
    await user.save();
  }
}

/** Load an owned job or throw (404 if missing, 403 if not the caller's). */
async function getOwned(user, id) {
  const job = await Job.findById(id);
  if (!job) throw ApiError.notFound('Job not found');
  if (String(job.client) !== String(user._id)) throw ApiError.forbidden('Not your job');
  return job;
}

function applyPatch(job, patch) {
  for (const key of WRITABLE) {
    if (patch[key] === undefined) continue;
    if (key === 'budget') {
      job.budget = { ...job.budget?.toObject?.(), ...patch.budget };
    } else {
      job[key] = patch[key];
    }
  }
}

export const jobService = {
  async create(user, data) {
    await ensureClient(user);
    const job = new Job({ client: user._id });
    applyPatch(job, data);
    if (!data.status) job.status = JOB_STATUS.OPEN;
    await job.save();
    return job;
  },

  /** Public job board — only OPEN jobs, with search + filters. */
  async list({ q, category, skills, budgetType, experienceLevel, duration, minBudget, maxBudget, sort, page, limit, skip }) {
    const filter = { status: JOB_STATUS.OPEN };
    if (category) filter.category = category;
    if (skills?.length) filter.skills = { $all: skills };
    if (budgetType) filter['budget.type'] = budgetType;
    if (experienceLevel) filter.experienceLevel = experienceLevel;
    if (duration) filter.duration = duration;
    if (minBudget != null || maxBudget != null) {
      filter['budget.max'] = {};
      if (minBudget != null) filter['budget.max'].$gte = minBudget;
      if (maxBudget != null) filter['budget.max'].$lte = maxBudget;
    }
    if (q) filter.$text = { $search: q };

    const sortMap = {
      recent: { createdAt: -1 },
      budget_asc: { 'budget.max': 1 },
      budget_desc: { 'budget.max': -1 },
    };
    const sortSpec = q ? { score: { $meta: 'textScore' } } : sortMap[sort] || { createdAt: -1 };

    const query = Job.find(filter).populate(...CLIENT_POPULATE).sort(sortSpec).skip(skip).limit(limit);
    if (q) query.select({ score: { $meta: 'textScore' } });

    const [items, total] = await Promise.all([query.exec(), Job.countDocuments(filter)]);
    return { items, total };
  },

  /** Single job. Non-open jobs are visible only to their owner. */
  async getById(id, user) {
    const job = await Job.findById(id).populate(...CLIENT_POPULATE);
    if (!job) throw ApiError.notFound('Job not found');
    if (job.status !== JOB_STATUS.OPEN) {
      const ownerId = job.client?._id || job.client;
      if (!user || String(ownerId) !== String(user._id)) throw ApiError.notFound('Job not found');
    }
    return job;
  },

  /** Caller's own jobs (any status). */
  async listMine(user, { status, page, limit, skip }) {
    const filter = { client: user._id };
    if (status) filter.status = status;
    const query = Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const [items, total] = await Promise.all([query.exec(), Job.countDocuments(filter)]);
    return { items, total };
  },

  async update(user, id, patch) {
    const job = await getOwned(user, id);
    applyPatch(job, patch);
    await job.save();
    return job;
  },

  async remove(user, id) {
    const job = await getOwned(user, id);
    await job.deleteOne();
    await SavedJob.deleteMany({ job: job._id });
    return { deleted: true };
  },

  /** Bookmark a job for the caller (idempotent). */
  async save(user, id) {
    const job = await Job.findById(id);
    if (!job) throw ApiError.notFound('Job not found');
    const existing = await SavedJob.findOne({ user: user._id, job: job._id });
    if (!existing) {
      await SavedJob.create({ user: user._id, job: job._id });
      await Job.updateOne({ _id: job._id }, { $inc: { savedCount: 1 } });
    }
    return { saved: true };
  },

  async unsave(user, id) {
    const res = await SavedJob.findOneAndDelete({ user: user._id, job: id });
    if (res) await Job.updateOne({ _id: id }, { $inc: { savedCount: -1 } });
    return { saved: false };
  },

  /** Caller's saved jobs, most-recently-saved first. */
  async listSaved(user, { page, limit, skip }) {
    const filter = { user: user._id };
    const query = SavedJob.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'job', populate: { path: 'client', select: 'name avatar role status' } });
    const [rows, total] = await Promise.all([query.exec(), SavedJob.countDocuments(filter)]);
    // Drop bookmarks whose job was deleted.
    const items = rows.filter((r) => r.job).map((r) => r.job);
    return { items, total };
  },
};
