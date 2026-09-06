import { asyncHandler } from '../utils/asyncHandler.js';
import { conversationService } from '../services/conversation.service.js';
import { messageService } from '../services/message.service.js';
import { ApiError } from '../utils/ApiError.js';

export const conversationController = {
  list: asyncHandler(async (req, res) => {
    const items = await conversationService.list(req.user, req.query);
    res.json({ success: true, data: { items } });
  }),
  createOrOpen: asyncHandler(async (req, res) => {
    const conversation = req.body.project
      ? await conversationService.resolveFromProject(req.user, req.body.project)
      : req.body.proposal
      ? await conversationService.resolveFromProposal(req.user, req.body.proposal)
      : await conversationService.createOrFind(req.user, req.body);
    res.json({ success: true, data: { conversation } });
  }),
  getOne: asyncHandler(async (req, res) => {
    const conversation = await conversationService.getById(req.user, req.params.conversationId);
    res.json({ success: true, data: { conversation } });
  }),
  listMessages: asyncHandler(async (req, res) => {
    const items = await messageService.list(req.params.conversationId, req.user, req.query);
    res.json({ success: true, data: { items } });
  }),
  markRead: asyncHandler(async (req, res) => {
    await messageService.markRead(req.user, req.params.conversationId);
    res.json({ success: true, data: { ok: true } });
  }),
  searchMessages: asyncHandler(async (req, res) => res.json({ success: true, data: { items: await messageService.search(req.user, req.params.conversationId, req.query.q) } })),
};
