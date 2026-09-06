import { Conversation } from '../models/Conversation.js';
import { Job } from '../models/Job.js';
import { Proposal } from '../models/Proposal.js';
import { ApiError } from '../utils/ApiError.js';
import { Project } from '../models/Project.js';
import mongoose from 'mongoose';

async function assertMembership(userId, conversation) {
  if (!conversation.participants.some((p) => String(p) === String(userId))) {
    throw ApiError.forbidden('You are not a participant in this conversation.');
  }
}

export const conversationService = {
  async getById(user, id) {
    const conversation = await Conversation.findById(id)
      .populate('participants', 'name avatar role status lastActiveAt')
      .populate('job', 'title status budget client')
      .populate('proposal', 'job freelancer client bid status')
      .populate('project', 'title status contract client freelancer')
      .populate('lastMessage');
    if (!conversation) throw ApiError.notFound('Conversation not found');
    await assertMembership(user._id, conversation);
    return conversation;
  },
  async list(user, query = {}) {
    const filter = { participants: user._id };
    if (query.search) filter.$or = [{ title: new RegExp(query.search.slice(0, 80), 'i') }];
    if (query.status) filter.status = query.status;
    return Conversation.find(filter)
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .populate('participants', 'name avatar role status lastActiveAt')
      .populate('job', 'title status budget client')
      .populate('proposal', 'job freelancer client bid status')
      .populate('project', 'title status contract client freelancer')
      .populate('lastMessage');
  },
  async createOrFind(user, payload) {
    // Both participant IDs come from authenticated marketplace records. Mark the
    // operator trusted so global filter sanitization does not cast `$all` as an ID.
    const filter = { participants: mongoose.trusted({ $all: [user._id, payload.otherUserId] }), type: payload.type };
    if (payload.job) filter.job = payload.job;
    if (payload.proposal) filter.proposal = payload.proposal;
    if (payload.contract) filter.contract = payload.contract;
    if (payload.project) filter.project = payload.project;
    const existing = await Conversation.findOne(filter);
    if (existing) return existing;
    const conversation = await Conversation.create({
      participants: [user._id, payload.otherUserId],
      type: payload.type || 'general',
      job: payload.job || null,
      proposal: payload.proposal || null,
      contract: payload.contract || null,
      project: payload.project || null,
    });
    return conversation;
  },
  async resolveFromProposal(user, proposalId) {
    const proposal = await Proposal.findById(proposalId);
    if (!proposal) throw ApiError.notFound('Proposal not found');
    if (String(proposal.client) !== String(user._id) && String(proposal.freelancer) !== String(user._id)) {
      throw ApiError.forbidden('Not allowed to message through this proposal');
    }
    const otherUserId = String(proposal.client) === String(user._id) ? proposal.freelancer : proposal.client;
    return this.createOrFind(user, { type: 'proposal', otherUserId, proposal: proposal._id, job: proposal.job });
  },
  async resolveFromJob(user, jobId, otherUserId) {
    const job = await Job.findById(jobId);
    if (!job) throw ApiError.notFound('Job not found');
    if (String(job.client) !== String(user._id) && String(otherUserId) !== String(job.client)) {
      throw ApiError.forbidden('Not allowed to message about this job');
    }
    return this.createOrFind(user, { type: 'job', otherUserId, job: job._id });
  },
  async resolveFromProject(user, projectId) {
    const project = await Project.findById(projectId);
    if (!project) throw ApiError.notFound('Project not found');
    if (![project.client, project.freelancer].some((member) => String(member) === String(user._id))) throw ApiError.forbidden('Not allowed to message through this project');
    const otherUserId = String(project.client) === String(user._id) ? project.freelancer : project.client;
    return this.createOrFind(user, { type: 'project', otherUserId, project: project._id, contract: project.contract });
  },
};
