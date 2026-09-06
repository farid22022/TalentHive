import { jobService } from '../services/job.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, paginated } from '../utils/ApiResponse.js';
import { parsePagination } from '../utils/pagination.js';
import { proposalService } from '../services/proposal.service.js';
import { Proposal } from '../models/Proposal.js';
import { FreelancerProfile } from '../models/FreelancerProfile.js';
import { Job } from '../models/Job.js';
import mongoose from 'mongoose';

export const jobController = {
  create: asyncHandler(async (req, res) => {
    const job = await jobService.create(req.user, req.body);
    return created(res, { job: job.toJSON() }, 'Job posted');
  }),

  list: asyncHandler(async (req, res) => {
    const q = req.validatedQuery || {};
    const { page, limit, skip } = parsePagination(q, { defaultLimit: 12, maxLimit: 50 });
    const { items, total } = await jobService.list({ ...q, page, limit, skip });
    return paginated(res, items.map((j) => j.toJSON()), { page, limit, total }, 'OK');
  }),

  listMine: asyncHandler(async (req, res) => {
    const q = req.validatedQuery || {};
    const { page, limit, skip } = parsePagination(q, { defaultLimit: 20, maxLimit: 50 });
    const { items, total } = await jobService.listMine(req.user, { ...q, page, limit, skip });
    return paginated(res, items.map((j) => j.toJSON()), { page, limit, total }, 'OK');
  }),

  listSaved: asyncHandler(async (req, res) => {
    const q = req.validatedQuery || {};
    const { page, limit, skip } = parsePagination(q, { defaultLimit: 20, maxLimit: 50 });
    const { items, total } = await jobService.listSaved(req.user, { ...q, page, limit, skip });
    return paginated(res, items.map((j) => j.toJSON()), { page, limit, total }, 'OK');
  }),
  applicants: asyncHandler(async (req, res) => { if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: 'Job not found' }); const job = await Job.findOne({ _id: new mongoose.Types.ObjectId(req.params.id), client: req.user._id }).select('title status budget'); if (!job) return res.status(404).json({ success: false, message: 'Job not found' }); const items = await Proposal.find({ job: job._id }).sort({ createdAt: -1 }).populate('freelancer', 'name avatar role status'); const ids = items.map((p) => p.freelancer?._id).filter(Boolean); const profiles = await FreelancerProfile.find({ user: mongoose.trusted({ $in: ids }) }).select('user title hourlyRate skills badges'); const profileMap = Object.fromEntries(profiles.map((p) => [String(p.user), p.toJSON()])); return ok(res, { job, totalApplicants: items.length, applicants: items.map((p) => { const json = p.toJSON(); json.freelancerProfile = profileMap[String(p.freelancer?._id)] || null; return json; }) }, 'OK'); }),

  getOne: asyncHandler(async (req, res) => {
    const job = await jobService.getById(req.params.id, req.user);
    return ok(res, { job: job.toJSON() }, 'OK');
  }),

  update: asyncHandler(async (req, res) => {
    const job = await jobService.update(req.user, req.params.id, req.body);
    return ok(res, { job: job.toJSON() }, 'Job updated');
  }),

  remove: asyncHandler(async (req, res) => {
    const out = await jobService.remove(req.user, req.params.id);
    return ok(res, out, 'Job deleted');
  }),

  save: asyncHandler(async (req, res) => {
    const out = await jobService.save(req.user, req.params.id);
    return ok(res, out, 'Job saved');
  }),

  unsave: asyncHandler(async (req, res) => {
    const out = await jobService.unsave(req.user, req.params.id);
    return ok(res, out, 'Job unsaved');
  }),
};
