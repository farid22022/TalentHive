import { asyncHandler } from '../utils/asyncHandler.js';
import { messageService } from '../services/message.service.js';

export const messageController = {
  create: asyncHandler(async (req, res) => {
    const message = await messageService.create(req.user, req.params.conversationId, req.body);
    res.status(201).json({ success: true, data: { message } });
  }),
  edit: asyncHandler(async (req, res) => res.json({ success: true, data: { message: await messageService.edit(req.user, req.params.messageId, req.body.text) } })),
  remove: asyncHandler(async (req, res) => res.json({ success: true, data: { message: await messageService.remove(req.user, req.params.messageId) } })),
  react: asyncHandler(async (req, res) => res.json({ success: true, data: { message: await messageService.react(req.user, req.params.messageId, req.body.emoji) } })),
  pin: asyncHandler(async (req, res) => res.json({ success: true, data: { message: await messageService.pin(req.user, req.params.messageId) } })),
};
