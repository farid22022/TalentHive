import { Proposal } from '../models/Proposal.js';
import { Job } from '../models/Job.js';
import { FreelancerProfile } from '../models/FreelancerProfile.js';
import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import {
  ACTIVE_PROPOSAL_STATUSES,
  JOB_STATUS,
  PROPOSAL_DECISION,
  PROPOSAL_STATUS,
  ROLES,
} from '../config/constants.js';
import { developerEligibility } from './virtualCard.service.js';

// Fields a freelancer may set on submit/revise.
const WRITABLE = ['coverLetter', 'bid', 'estimatedDays', 'milestones', 'aiAssisted'];

const JOB_SELECT = 'title status category budget client experienceLevel duration createdAt';
const FREELANCER_SELECT = 'name avatar role status';

/** Ensure the caller can own proposals, granting the freelancer role if missing. */
async function ensureFreelancer(user) {
  if (!user.hasRole(ROLES.FREELANCER)) {
    user.roles = Array.from(new Set([...(user.roles || []), ROLES.FREELANCER]));
    await user.save();
  }
}

function applyPatch(proposal, patch) {
  for (const key of WRITABLE) {
    if (patch[key] === undefined) continue;
    if (key === 'bid') {
      proposal.bid = { ...proposal.bid?.toObject?.(), ...patch.bid };
    } else {
      proposal[key] = patch[key];
    }
  }
}

const isActive = (status) => ACTIVE_PROPOSAL_STATUSES.includes(status);

/** Load a proposal the caller authored, or throw (404 missing, 403 not theirs). */
async function getOwned(user, id) {
  const proposal = await Proposal.findById(id);
  if (!proposal) throw ApiError.notFound('Proposal not found');
  if (String(proposal.freelancer) !== String(user._id)) throw ApiError.forbidden('Not your proposal');
  return proposal;
}

/** Load a proposal on one of the caller's jobs, or throw (404 missing, 403 not theirs). */
async function getReceived(user, id) {
  const proposal = await Proposal.findById(id);
  if (!proposal) throw ApiError.notFound('Proposal not found');
  if (String(proposal.client) !== String(user._id)) throw ApiError.forbidden('Not your job');
  return proposal;
}

/**
 * Public-profile snippets for a set of freelancers, keyed by user id. Lets the client review
 * queue show rate/skills/badges without an extra round-trip per proposal.
 */
async function profileSnippets(userIds) {
  if (!userIds.length) return {};
  // IDs originate from proposal records, so this internal operator is safe even with
  // global query sanitization enabled for external request filters.
  const profiles = await FreelancerProfile.find({ user: mongoose.trusted({ $in: userIds }) }).select(
    'user title hourlyRate skills badges completeness verificationState'
  );
  return Object.fromEntries(
    profiles.map((p) => [
      String(p.user),
      {
        title: p.title,
        hourlyRate: p.hourlyRate,
        skills: p.skills,
        badges: p.badges,
        completeness: p.completeness,
        verificationState: p.verificationState,
      },
    ])
  );
}

export const proposalService = {
  /** Submit a proposal to an open job (one per freelancer per job; withdrawn ones are revived). */
  async create(user, { job: jobId, ...data }) {
    const job = await Job.findById(jobId);
    if (!job) throw ApiError.notFound('Job not found');
    if (String(job.client) === String(user._id)) {
      throw ApiError.badRequest('You cannot submit a proposal to your own job');
    }
    if (job.status !== JOB_STATUS.OPEN) {
      throw ApiError.badRequest('This job is not accepting proposals');
    }

    const eligibility = await developerEligibility(user);
    if (!eligibility.canApplyForJobs) {
      throw new ApiError(403, 'Activate your virtual card before applying for jobs.', 'CARD_ACTIVATION_REQUIRED', { amountRequired: eligibility.amountRequired || 0 });
    }

    const existing = await Proposal.findOne({ job: job._id, freelancer: user._id });
    if (existing && existing.status !== PROPOSAL_STATUS.WITHDRAWN) {
      throw ApiError.conflict('You have already submitted a proposal for this job');
    }

    await ensureFreelancer(user);

    // Reuse the withdrawn row so the unique {job,freelancer} index still holds.
    const proposal = existing || new Proposal({ job: job._id, freelancer: user._id, client: job.client });
    applyPatch(proposal, data);
    proposal.status = PROPOSAL_STATUS.SUBMITTED;
    proposal.reviewNote = '';
    proposal.viewedAt = null;
    proposal.decidedAt = null;
    proposal.withdrawnAt = null;
    await proposal.save();

    // Withdrawing already decremented, so both new and revived proposals add one back.
    await Job.updateOne({ _id: job._id }, { $inc: { proposalsCount: 1 } });
    return proposal;
  },

  /** The caller's own proposals, newest first. */
  async listMine(user, { job, status, limit, skip }) {
    const filter = { freelancer: user._id };
    if (job) filter.job = job;
    if (status) filter.status = status;
    const [items, total] = await Promise.all([
      Proposal.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: 'job', select: JOB_SELECT, populate: { path: 'client', select: FREELANCER_SELECT } }),
      Proposal.countDocuments(filter),
    ]);
    return { items, total };
  },

  /** Proposals received across the caller's jobs, with freelancer profile snippets. */
  async listReceived(user, { job, status, sort, limit, skip }) {
    const filter = { client: user._id };
    if (job) filter.job = job;
    if (status) filter.status = status;

    const sortMap = {
      recent: { createdAt: -1 },
      bid_asc: { 'bid.amount': 1 },
      bid_desc: { 'bid.amount': -1 },
    };

    const [items, total] = await Promise.all([
      Proposal.find(filter)
        .sort(sortMap[sort] || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('freelancer', FREELANCER_SELECT)
        .populate({ path: 'job', select: JOB_SELECT }),
      Proposal.countDocuments(filter),
    ]);

    const profiles = await profileSnippets(items.map((p) => p.freelancer?._id).filter(Boolean));
    return { items, total, profiles };
  },

  /** Single proposal — visible to its author and to the job owner only. */
  async getById(user, id) {
    const proposal = await Proposal.findById(id)
      .populate('freelancer', FREELANCER_SELECT)
      .populate({ path: 'job', select: JOB_SELECT, populate: { path: 'client', select: FREELANCER_SELECT } });
    if (!proposal) throw ApiError.notFound('Proposal not found');

    const me = String(user._id);
    const isAuthor = String(proposal.freelancer?._id || proposal.freelancer) === me;
    const isClient = String(proposal.client) === me;
    if (!isAuthor && !isClient) throw ApiError.notFound('Proposal not found');

    // Record the client's first read so the freelancer can see it was reviewed.
    if (isClient && !proposal.viewedAt) {
      proposal.viewedAt = new Date();
      await proposal.save();
    }

    const profiles = await profileSnippets([proposal.freelancer?._id].filter(Boolean));
    return { proposal, profiles };
  },

  /** Revise an own proposal while it is still active. */
  async update(user, id, patch) {
    const proposal = await getOwned(user, id);
    if (!isActive(proposal.status)) {
      throw ApiError.badRequest(`A ${proposal.status} proposal can no longer be edited`);
    }
    applyPatch(proposal, patch);
    await proposal.save();
    return proposal;
  },

  /** Withdraw an own proposal; frees the slot on the job's counter. */
  async withdraw(user, id) {
    const proposal = await getOwned(user, id);
    if (!isActive(proposal.status)) {
      throw ApiError.badRequest(`This proposal is already ${proposal.status}`);
    }
    proposal.status = PROPOSAL_STATUS.WITHDRAWN;
    proposal.withdrawnAt = new Date();
    await proposal.save();
    await Job.updateOne({ _id: proposal.job, proposalsCount: { $gt: 0 } }, { $inc: { proposalsCount: -1 } });
    return proposal;
  },

  /**
   * Job owner review: shortlist, reject, or move back to submitted. Hiring (`accepted`)
   * is deliberately not reachable here — contracts arrive in Phase 8.
   */
  async decide(user, id, { decision, reviewNote }) {
    const proposal = await getReceived(user, id);
    if (proposal.status === PROPOSAL_STATUS.WITHDRAWN) {
      throw ApiError.badRequest('This proposal was withdrawn by the freelancer');
    }
    if (proposal.status === PROPOSAL_STATUS.ACCEPTED) {
      throw ApiError.badRequest('This proposal was already accepted');
    }

    const nextStatus = {
      [PROPOSAL_DECISION.SHORTLIST]: PROPOSAL_STATUS.SHORTLISTED,
      [PROPOSAL_DECISION.REJECT]: PROPOSAL_STATUS.REJECTED,
      [PROPOSAL_DECISION.RECONSIDER]: PROPOSAL_STATUS.SUBMITTED,
    }[decision];

    proposal.status = nextStatus;
    if (reviewNote !== undefined) proposal.reviewNote = reviewNote;
    proposal.decidedAt = decision === PROPOSAL_DECISION.RECONSIDER ? null : new Date();
    if (!proposal.viewedAt) proposal.viewedAt = new Date();
    await proposal.save();
    return proposal;
  },
};
