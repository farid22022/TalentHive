import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/ApiResponse.js';
import { projectWorkspaceService as s } from '../services/projectWorkspace.service.js';
export const projectWorkspaceController = {
  board: asyncHandler(async (req, res) => ok(res, await s.board(req.user, req.params.id))),
  createTask: asyncHandler(async (req, res) => created(res, { task: await s.createTask(req.user, req.params.id, req.body) }, 'Task created')),
  updateTask: asyncHandler(async (req, res) => ok(res, { task: await s.updateTask(req.user, req.params.taskId, req.body) })),
  createIssue: asyncHandler(async (req, res) => created(res, { issue: await s.createIssue(req.user, req.params.id, req.body) }, 'Issue reported')),
  updateIssue: asyncHandler(async (req, res) => ok(res, { issue: await s.updateIssue(req.user, req.params.issueId, req.body) })),
  requestDeletion: asyncHandler(async (req, res) => ok(res, { project: await s.requestDeletion(req.user, req.params.id) }, 'Deletion requested')),
  confirmDeletion: asyncHandler(async (req, res) => ok(res, { project: await s.confirmDeletion(req.user, req.params.id) }, 'Deletion confirmed')),
  deleteProject: asyncHandler(async (req, res) => ok(res, { project: await s.deleteProject(req.user, req.params.id) }, 'Project deleted')),
};
