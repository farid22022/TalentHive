import mongoose from 'mongoose';
import { Offer } from '../models/Offer.js';
import { Contract } from '../models/Contract.js';
import { Project } from '../models/Project.js';
import { Milestone } from '../models/Milestone.js';
import { WorkSubmission } from '../models/WorkSubmission.js';
import { Activity } from '../models/Activity.js';
import { Notification } from '../models/Notification.js';
import { Proposal } from '../models/Proposal.js';
import { Job } from '../models/Job.js';
import { ApiError } from '../utils/ApiError.js';
import { BUDGET_TYPE, CONTRACT_STATUS, JOB_STATUS, MILESTONE_STATUS, OFFER_STATUS, PROJECT_STATUS, PROPOSAL_INVITATION_STATUS, PROPOSAL_STATUS, SUBMISSION_STATUS } from '../config/constants.js';

const id = (v) => String(v);
const activeContract = (c) => [CONTRACT_STATUS.DRAFT, CONTRACT_STATUS.ACTIVE, CONTRACT_STATUS.PAUSED, CONTRACT_STATUS.DISPUTED].includes(c.status);
const notify = (recipient, type, metadata = {}) => Notification.create({ recipient, type, ...metadata });
const audit = (actor, action, resourceType, resourceId, project, metadata = {}) => Activity.create({ actor, action, resourceType, resourceId, project, metadata });

async function offerFor(user, offerId) {
  if (!mongoose.isValidObjectId(offerId)) throw ApiError.badRequest('Invalid offer identifier');
  const offer = await Offer.findById(offerId).populate('job proposal');
  if (!offer) throw ApiError.notFound('Offer not found');
  if (id(offer.client) !== id(user._id) && id(offer.freelancer) !== id(user._id)) throw ApiError.notFound('Offer not found');
  return offer;
}

function validateDates(body) {
  const start = body.startDate ? new Date(body.startDate) : null;
  const end = body.endDate ? new Date(body.endDate) : null;
  if (start && Number.isNaN(start.valueOf())) throw ApiError.badRequest('Invalid start date');
  if (end && Number.isNaN(end.valueOf())) throw ApiError.badRequest('Invalid end date');
  if (start && end && end <= start) throw ApiError.badRequest('End date must be after start date');
  for (const item of body.milestones || []) if (item.dueDate && start && end && (new Date(item.dueDate) < start || new Date(item.dueDate) > end)) throw ApiError.badRequest('Milestone dates must be within the offer timeline');
}

export const hiringService = {
  async createOffer(user, body) {
    const proposal = body.job && body.freelancer
      ? await Proposal.findOne({ job: body.job, freelancer: body.freelancer })
      : await Proposal.findById(body.proposal);
    if (!proposal) throw ApiError.badRequest('Proposal could not be matched to this applicant');
    const job = await Job.findById(proposal.job);
    if (!job || id(job.client) !== id(user._id)) throw ApiError.forbidden('You do not own this job');
    if (!mongoose.isValidObjectId(job._id) || !mongoose.isValidObjectId(proposal.freelancer)) throw ApiError.badRequest('Applicant data contains an invalid database identifier');
    // A job can have several independent offers/contracts; only closed jobs reject hiring.
    if (![JOB_STATUS.OPEN, JOB_STATUS.FILLED].includes(job.status)) throw ApiError.badRequest('This job is no longer available for hiring');
    if (![PROPOSAL_STATUS.SUBMITTED, PROPOSAL_STATUS.SHORTLISTED].includes(proposal.status)) throw ApiError.badRequest('This proposal is not eligible for hiring');
    const existingOffer = await Offer.findOne({ proposal: proposal._id }).sort({ createdAt: -1 }).lean();
    if (existingOffer && [OFFER_STATUS.DRAFT, OFFER_STATUS.SENT, OFFER_STATUS.VIEWED, OFFER_STATUS.CHANGES_REQUESTED].includes(existingOffer.status)) throw ApiError.conflict('An invitation has already been sent for this proposal');
    const existing = await Contract.findOne({ job: job._id, freelancer: proposal.freelancer }).lean();
    if (existing && activeContract({ ...existing, status: String(existing.status) })) throw ApiError.conflict('This freelancer already has an active contract for the job');
    validateDates(body);
    const milestones = body.milestones || [];
    if (body.contractType === BUDGET_TYPE.FIXED && Math.abs(milestones.reduce((sum, m) => sum + (m.amount || 0), 0) - (body.totalBudget || 0)) > 0.01) throw ApiError.badRequest('Milestone amounts must equal the total budget');
    const offer = await Offer.create({ ...body, proposal: proposal._id, client: user._id, freelancer: proposal.freelancer, job: job._id, status: OFFER_STATUS.DRAFT });
    await audit(user._id, 'OFFER_CREATED', 'Offer', offer._id, null, { proposal: proposal._id });
    return offer;
  },

  async listOffers(user, filter = {}) {
    const query = { $or: [{ client: user._id }, { freelancer: user._id }] };
    if (filter.status) query.status = filter.status;
    return Offer.find(query).sort({ createdAt: -1 }).populate('job', 'title status').populate('freelancer', 'name avatar').populate('client', 'name avatar');
  },
  getOffer: offerFor,

  async sendOffer(user, offerId) {
    const offer = await offerFor(user, offerId);
    if (id(offer.client) !== id(user._id)) throw ApiError.forbidden('Only the client can send an offer');
    if (![OFFER_STATUS.DRAFT, OFFER_STATUS.CHANGES_REQUESTED].includes(offer.status)) throw ApiError.badRequest('Offer cannot be sent in its current state');
    offer.status = OFFER_STATUS.SENT; offer.changeRequest = '';
    if (!offer.expiresAt || offer.expiresAt <= new Date()) offer.expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await offer.save(); await Proposal.updateOne({ _id: offer.proposal }, { $set: { offer: offer._id, invitationStatus: PROPOSAL_INVITATION_STATUS.SENT } }); await notify(offer.freelancer, 'OFFER_SENT', { sender: user._id }); await audit(user._id, 'OFFER_SENT', 'Offer', offer._id);
    return offer;
  },
  async viewOffer(user, offerId) { const offer = await offerFor(user, offerId); if (id(offer.freelancer) === id(user._id) && offer.status === OFFER_STATUS.SENT) { offer.status = OFFER_STATUS.VIEWED; await offer.save(); } return offer; },
  async requestChanges(user, offerId, message) { const offer = await offerFor(user, offerId); if (id(offer.freelancer) !== id(user._id)) throw ApiError.forbidden('Only the freelancer can request changes'); if (![OFFER_STATUS.SENT, OFFER_STATUS.VIEWED].includes(offer.status)) throw ApiError.badRequest('Offer is not awaiting review'); offer.status = OFFER_STATUS.CHANGES_REQUESTED; offer.changeRequest = message; await offer.save(); await Proposal.updateOne({ _id: offer.proposal }, { $set: { invitationStatus: PROPOSAL_INVITATION_STATUS.CHANGES_REQUESTED } }); await notify(offer.client, 'OFFER_CHANGES_REQUESTED', { sender: user._id }); return offer; },
  async rejectOffer(user, offerId) { const offer = await offerFor(user, offerId); if (id(offer.freelancer) !== id(user._id)) throw ApiError.forbidden('Only the freelancer can decline an offer'); if (![OFFER_STATUS.SENT, OFFER_STATUS.VIEWED, OFFER_STATUS.CHANGES_REQUESTED].includes(offer.status)) throw ApiError.badRequest('Offer cannot be declined'); offer.status = OFFER_STATUS.REJECTED; offer.rejectedAt = new Date(); await offer.save(); await Proposal.updateOne({ _id: offer.proposal }, { $set: { invitationStatus: PROPOSAL_INVITATION_STATUS.DECLINED } }); await notify(offer.client, 'OFFER_REJECTED', { sender: user._id }); return offer; },
  async withdrawOffer(user, offerId) { const offer = await offerFor(user, offerId); if (id(offer.client) !== id(user._id)) throw ApiError.forbidden('Only the client can withdraw an offer'); if (![OFFER_STATUS.DRAFT, OFFER_STATUS.SENT, OFFER_STATUS.VIEWED, OFFER_STATUS.CHANGES_REQUESTED].includes(offer.status)) throw ApiError.badRequest('Offer cannot be withdrawn'); offer.status = OFFER_STATUS.WITHDRAWN; await offer.save(); return offer; },

  async acceptOffer(user, offerId) {
    const offer = await offerFor(user, offerId);
    if (id(offer.freelancer) !== id(user._id)) throw ApiError.forbidden('Only the freelancer can accept an offer');
    const existing = await Contract.findOne({ offer: offer._id });
    if (existing) return { offer, contract: existing, project: await Project.findOne({ contract: existing._id }) };
    if (![OFFER_STATUS.SENT, OFFER_STATUS.VIEWED].includes(offer.status) || (offer.expiresAt && offer.expiresAt <= new Date())) throw ApiError.badRequest('Offer is no longer available');
    const job = await Job.findById(offer.job); if (!job || ![JOB_STATUS.OPEN, JOB_STATUS.FILLED].includes(job.status)) throw ApiError.badRequest('Job is no longer available');
    const conflict = await Contract.findOne({ job: job._id, freelancer: offer.freelancer }).lean();
    if (conflict && activeContract({ ...conflict, status: String(conflict.status) })) throw ApiError.conflict('The freelancer already has an active contract for this job');
    const contractNumber = `CG-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const contract = await Contract.create({ client: offer.client, freelancer: offer.freelancer, job: offer.job, proposal: offer.proposal, offer: offer._id, contractNumber, title: offer.title, description: offer.description, type: offer.contractType, rate: offer.rate, totalAmount: offer.totalBudget, estimatedHours: offer.estimatedHours, startDate: offer.startDate, endDate: offer.endDate, terms: offer.terms, status: CONTRACT_STATUS.ACTIVE, signedAt: new Date() });
    const project = await Project.create({ client: offer.client, freelancer: offer.freelancer, job: offer.job, contract: contract._id, title: offer.title, description: offer.description, status: PROJECT_STATUS.NOT_STARTED, startDate: offer.startDate, dueDate: offer.endDate });
    if (offer.contractType === BUDGET_TYPE.FIXED) await Milestone.insertMany(offer.milestones.map((m, order) => ({ ...m.toObject?.() || m, project: project._id, contract: contract._id, order })));
    offer.status = OFFER_STATUS.ACCEPTED; offer.acceptedAt = new Date(); await offer.save();
    await Proposal.updateOne({ _id: offer.proposal }, { $set: { status: PROPOSAL_STATUS.ACCEPTED, invitationStatus: PROPOSAL_INVITATION_STATUS.ACCEPTED, decidedAt: new Date() } });
    await Job.updateOne({ _id: job._id }, { $set: { status: JOB_STATUS.FILLED } });
    await notify(offer.client, 'OFFER_ACCEPTED', { sender: user._id }); await audit(user._id, 'OFFER_ACCEPTED', 'Offer', offer._id, project._id, { contract: contract._id });
    return { offer, contract, project };
  },

  async listContracts(user) { return Contract.find({ $or: [{ client: user._id }, { freelancer: user._id }] }).sort({ createdAt: -1 }).populate('project'); },
  async getContract(user, contractId) { const c = await Contract.findById(contractId); if (!c) throw ApiError.notFound('Contract not found'); if (id(c.client) !== id(user._id) && id(c.freelancer) !== id(user._id)) throw ApiError.notFound('Contract not found'); return c; },
  async contractAction(user, contractId, action) { const c = await this.getContract(user, contractId); if (id(c.client) !== id(user._id)) throw ApiError.forbidden('Only the client can manage this contract'); const next = { pause: CONTRACT_STATUS.PAUSED, resume: CONTRACT_STATUS.ACTIVE, cancel: CONTRACT_STATUS.CANCELLED, complete: CONTRACT_STATUS.COMPLETED }[action]; const allowed = { pause: [CONTRACT_STATUS.ACTIVE], resume: [CONTRACT_STATUS.PAUSED], cancel: [CONTRACT_STATUS.ACTIVE, CONTRACT_STATUS.PAUSED], complete: [CONTRACT_STATUS.ACTIVE] }[action]; if (!allowed.includes(c.status)) throw ApiError.badRequest('Invalid contract transition'); c.status = next; if (action === 'cancel') c.cancelledAt = new Date(); if (action === 'complete') c.completedAt = new Date(); await c.save(); if (action === 'complete') { const { createReviewEligibility } = await import('./review.service.js'); await createReviewEligibility(c._id); } return c; },

  async listProjects(user) { return Project.find({ $or: [{ client: user._id }, { freelancer: user._id }] }).sort({ updatedAt: -1 }); },
  async getProject(user, projectId) { const p = await Project.findById(projectId).populate('contract'); if (!p) throw ApiError.notFound('Project not found'); if (id(p.client) !== id(user._id) && id(p.freelancer) !== id(user._id)) throw ApiError.notFound('Project not found'); return p; },
  async milestones(user, projectId) { const p = await this.getProject(user, projectId); return Milestone.find({ project: p._id }).sort({ order: 1 }); },
  async startMilestone(user, milestoneId) { const m = await Milestone.findById(milestoneId).populate('project'); if (!m) throw ApiError.notFound('Milestone not found'); if (id(m.project.freelancer) !== id(user._id)) throw ApiError.forbidden('Only the freelancer can start a milestone'); if (![MILESTONE_STATUS.FUNDED, MILESTONE_STATUS.REVISION_REQUESTED].includes(m.status)) throw ApiError.badRequest('Milestone cannot be started'); m.status = MILESTONE_STATUS.IN_PROGRESS; m.startedAt = new Date(); await m.save(); await Project.updateOne({ _id: m.project._id, status: PROJECT_STATUS.NOT_STARTED }, { $set: { status: PROJECT_STATUS.IN_PROGRESS } }); return m; },
  async submitWork(user, milestoneId, body) { const m = await Milestone.findById(milestoneId).populate('project'); if (!m) throw ApiError.notFound('Milestone not found'); if (id(m.project.freelancer) !== id(user._id)) throw ApiError.forbidden('Only the freelancer can submit work'); if (![MILESTONE_STATUS.IN_PROGRESS, MILESTONE_STATUS.REVISION_REQUESTED].includes(m.status)) throw ApiError.badRequest('Milestone is not ready for submission'); const last = await WorkSubmission.findOne({ milestone: m._id }).sort({ version: -1 }); const submission = await WorkSubmission.create({ ...body, milestone: m._id, project: m.project._id, contract: m.project.contract, submittedBy: user._id, version: (last?.version || 0) + 1 }); m.status = MILESTONE_STATUS.SUBMITTED; m.submittedAt = new Date(); await m.save(); await Project.updateOne({ _id: m.project._id }, { $set: { status: PROJECT_STATUS.REVIEW } }); await notify(m.project.client, 'WORK_SUBMITTED', { sender: user._id }); return submission; },
  async submissions(user, milestoneId) { const m = await Milestone.findById(milestoneId).populate('project'); if (!m) throw ApiError.notFound('Milestone not found'); if (![m.project.client, m.project.freelancer].some((x) => id(x) === id(user._id))) throw ApiError.notFound('Milestone not found'); return WorkSubmission.find({ milestone: m._id }).sort({ version: -1 }); },
  async reviewSubmission(user, submissionId, action, feedback = '') { const s = await WorkSubmission.findById(submissionId).populate({ path: 'milestone', populate: { path: 'project' } }); if (!s) throw ApiError.notFound('Submission not found'); const p = s.milestone.project; if (id(p.client) !== id(user._id)) throw ApiError.forbidden('Only the client can review work'); if (s.status !== SUBMISSION_STATUS.SUBMITTED) throw ApiError.badRequest('Submission is not awaiting review'); if (action === 'revision' && feedback.trim().length < 3) throw ApiError.badRequest('Revision feedback is required'); s.status = action === 'approve' ? SUBMISSION_STATUS.APPROVED : SUBMISSION_STATUS.REVISION_REQUESTED; s.feedback = feedback; s.reviewedAt = new Date(); await s.save(); const m = s.milestone; m.status = action === 'approve' ? MILESTONE_STATUS.APPROVED : MILESTONE_STATUS.REVISION_REQUESTED; m.approvedAt = action === 'approve' ? new Date() : undefined; if (action === 'approve') m.paymentState = 'payment_pending'; await m.save(); if (action === 'revision') { p.status = PROJECT_STATUS.REVISION; await p.save(); } else { const all = await Milestone.find({ project: p._id }); const approved = all.length > 0 && all.every((x) => [MILESTONE_STATUS.APPROVED, MILESTONE_STATUS.PAID].includes(x.status)); p.progress = all.length ? Math.round((all.filter((x) => [MILESTONE_STATUS.APPROVED, MILESTONE_STATUS.PAID].includes(x.status)).length / all.length) * 100) : 0; if (approved) { p.status = PROJECT_STATUS.COMPLETED; p.completedAt = new Date(); } await p.save(); } await notify(p.freelancer, action === 'approve' ? 'WORK_APPROVED' : 'REVISION_REQUESTED', { sender: user._id }); return s; },
};
