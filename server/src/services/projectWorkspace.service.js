import { Payment } from '../models/Payment.js';
import { Contract } from '../models/Contract.js';
import { config } from '../config/index.js';
import { publicPayment } from './payment.service.js';
import mongoose from 'mongoose';
import { Project } from '../models/Project.js';
import { ProjectTask } from '../models/ProjectTask.js';
import { ProjectIssue } from '../models/ProjectIssue.js';
import { Milestone } from '../models/Milestone.js';
import { Activity } from '../models/Activity.js';
import { ApiError } from '../utils/ApiError.js';
const same = (a, b) => String(a) === String(b);
async function access(user, projectId) {
  if (!mongoose.isValidObjectId(projectId)) throw ApiError.badRequest('Invalid project identifier');
  const p = await Project.findById(projectId);
  if (!p || (!same(p.client, user._id) && !same(p.freelancer, user._id))) throw ApiError.notFound('Project not found');
  return p;
}
async function log(user, action, resourceType, resourceId, project) { await Activity.create({ actor: user._id, action, resourceType, resourceId, project: project._id }); }
export const projectWorkspaceService = {
  async board(user, projectId) {
    const p = await access(user, projectId);
    const canFundMilestones = same(p.client, user._id);
    // The existing hiring model creates one project per developer contract.
    // Present sibling contracts for the same job together to their owning client.
    const projects = canFundMilestones ? await Project.find({ job: p.job, client: p.client, deletedAt: mongoose.trusted({ $exists: false }) }).populate('freelancer', 'name email avatarUrl') : [await p.populate('freelancer', 'name email avatarUrl')];
    const projectIds = projects.map(row => row._id);
    const projectFilter = mongoose.trusted({ $in: projectIds });
    const [tasks, issues, milestones, payments, contracts] = await Promise.all([
      ProjectTask.find({ project: p._id }).populate('assignedTo', 'name email avatarUrl').sort({ createdAt: 1 }),
      ProjectIssue.find({ project: p._id }).sort({ createdAt: -1 }),
      Milestone.find({ project: projectFilter }).sort({ order: 1 }).lean(),
      Payment.find({ project: projectFilter }).sort({ createdAt: -1 }),
      Contract.find({ _id: mongoose.trusted({ $in: projects.map(row => row.contract) }) }).select('title totalAmount status')
    ]);
    const minor = (value) => Math.round(Number(value || 0) * 100);
    const funded = payments.filter(p => ['succeeded', 'partially_refunded', 'refunded'].includes(p.status)).reduce((sum, p) => sum + p.amountMinor, 0);
    const escrow = payments.filter(p => p.escrowStatus === 'funded').reduce((sum, p) => sum + p.amountMinor, 0);
    const released = payments.filter(p => p.escrowStatus === 'released').reduce((sum, p) => sum + p.amountMinor, 0);
    const total = contracts.reduce((sum, c) => sum + minor(c.totalAmount), 0);
    const contract = contracts.find(c => same(c._id, p.contract));
    for (const m of milestones) { m.developer = projects.find(row => same(row._id, m.project))?.freelancer; m.contractTitle = contracts.find(c => same(c._id, m.contract))?.title; }
    return { project: await p.populate('client freelancer', 'name email avatarUrl'), contract, permissions: { canFundMilestones }, team: [...new Map(projects.map(row => [String(row.freelancer._id), row.freelancer])).values()], tasks, issues, milestones, payments: payments.map(publicPayment), financialSummary: { currency: config.payment.currency, total: total / 100, funded: funded / 100, escrow: escrow / 100, released: released / 100, remaining: Math.max(0, total - funded) / 100 } };
  },
  async createTask(user, projectId, body) { const p = await access(user, projectId); if (!same(p.freelancer, user._id) && !same(p.client, user._id)) throw ApiError.forbidden('You cannot create tasks for this project'); if (body.assignedTo && !same(p.client, user._id)) throw ApiError.forbidden('Only the client can assign freelancers'); const task = await ProjectTask.create({ title: body.title, description: body.description, project: p._id, assignedTo: body.assignedTo || null }); await log(user, 'TASK_CREATED', 'ProjectTask', task._id, p); return task; },
  async updateTask(user, taskId, body) { const task = await ProjectTask.findById(taskId); if (!task) throw ApiError.notFound('Task not found'); const p = await access(user, task.project); const isClient = same(p.client, user._id); if (!isClient && !same(task.assignedTo, user._id) && !same(p.freelancer, user._id)) throw ApiError.forbidden('You cannot update this task'); if (body.assignedTo && !isClient) throw ApiError.forbidden('Only the client can assign freelancers'); if (body.status === 'DONE' && !isClient) throw ApiError.forbidden('Only the client can approve a task'); if (body.status === 'IN_REVIEW' && !['IN_PROGRESS', 'IN_REVIEW'].includes(task.status)) throw ApiError.badRequest('Task must be in progress before review'); const allowed = ['title', 'description', 'assignedTo', 'progress', 'status', 'revisionReason']; for (const key of allowed) if (body[key] !== undefined) task[key] = body[key]; if (body.status === 'IN_PROGRESS' && !task.startedAt) task.startedAt = new Date(); if (body.status === 'IN_REVIEW') task.submittedAt = new Date(); if (body.status === 'DONE') task.completedAt = new Date(); await task.save(); await log(user, 'TASK_UPDATED', 'ProjectTask', task._id, p); return task; },
  async createIssue(user, projectId, body) { const p = await access(user, projectId); const issue = await ProjectIssue.create({ ...body, project: p._id, reporter: user._id }); await log(user, 'ISSUE_CREATED', 'ProjectIssue', issue._id, p); return issue; },
  async updateIssue(user, issueId, body) { const issue = await ProjectIssue.findById(issueId); if (!issue) throw ApiError.notFound('Issue not found'); const p = await access(user, issue.project); if (!same(p.client, user._id) && !same(issue.assignee, user._id) && !same(p.freelancer, user._id)) throw ApiError.forbidden('You cannot update this issue'); Object.assign(issue, body); if (body.status === 'RESOLVED') issue.resolvedAt = new Date(); if (body.status === 'CLOSED' && !same(p.client, user._id)) throw ApiError.forbidden('Only the client can close an issue'); await issue.save(); await log(user, 'ISSUE_UPDATED', 'ProjectIssue', issue._id, p); return issue; },
  async requestDeletion(user, projectId) { const p = await access(user, projectId); if (!same(p.client, user._id)) throw ApiError.forbidden('Only the client can request project deletion'); if (p.deletedAt) throw ApiError.badRequest('Project is already deleted'); p.deletionRequestedAt = p.deletionRequestedAt || new Date(); await p.save(); await log(user, 'PROJECT_DELETION_REQUESTED', 'Project', p._id, p); return p; },
  async confirmDeletion(user, projectId) { const p = await access(user, projectId); if (same(p.client, user._id)) throw ApiError.badRequest('The client cannot confirm as a freelancer'); if (!same(p.freelancer, user._id)) throw ApiError.forbidden('Only an accepted project freelancer can confirm deletion'); if (!p.deletionRequestedAt) throw ApiError.badRequest('The client has not requested project deletion'); if (!p.deletionConfirmedBy.some((id) => same(id, user._id))) p.deletionConfirmedBy.push(user._id); await p.save(); await log(user, 'PROJECT_DELETION_CONFIRMED', 'Project', p._id, p); return p; },
  async deleteProject(user, projectId) { const p = await access(user, projectId); if (!same(p.client, user._id)) throw ApiError.forbidden('Only the client can delete the project'); if (!p.deletionRequestedAt) throw ApiError.badRequest('Freelancer confirmation is required before deletion'); const required = [p.freelancer].filter(Boolean); if (!required.every((member) => p.deletionConfirmedBy.some((id) => same(id, member)))) throw ApiError.badRequest('All accepted freelancers must confirm project deletion'); p.deletedAt = new Date(); await p.save(); await log(user, 'PROJECT_DELETED', 'Project', p._id, p); return p; },
};
