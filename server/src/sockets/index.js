import { verifyAccessToken } from '../utils/tokens.js';
import { User } from '../models/User.js';
import { USER_STATUS } from '../config/constants.js';
import { conversationService } from '../services/conversation.service.js';
import { messageService } from '../services/message.service.js';
import { presenceService } from '../services/presence.service.js';
import { logger } from '../config/logger.js';

/**
 * Socket.IO wiring. Phase 1 establishes an authenticated connection + presence.
 * Chat/typing/notification events are added in Phase 7.
 */
export function registerSocketHandlers(io) {
  // JWT handshake auth.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const payload = verifyAccessToken(token);
      socket.userId = payload.sub;
      socket.role = payload.role;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.data.rooms = new Set();
    // Personal room for user-targeted events (notifications, updates).
    socket.join(`user:${socket.userId}`);
    presenceService.markOnline(socket.userId);
    logger.debug({ userId: socket.userId }, 'socket connected');

    socket.on('join_conversation', async ({ conversationId }, ack) => {
      try {
        const conversation = await conversationService.getById({ _id: socket.userId }, conversationId);
        const room = `conversation:${conversationId}`;
        socket.join(room);
        socket.data.rooms.add(room);
        ack?.({ success: true, data: { conversation } });
      } catch (err) {
        ack?.({ success: false, message: err.message });
      }
    });

    socket.on('leave_conversation', ({ conversationId }) => {
      const room = `conversation:${conversationId}`;
      socket.leave(room);
      socket.data.rooms.delete(room);
    });

    socket.on('send_message', async (payload, ack) => {
      try {
        const message = await messageService.create({ _id: socket.userId }, payload.conversationId, payload);
        const conversation = await conversationService.getById({ _id: socket.userId }, payload.conversationId);
        io.to(`conversation:${payload.conversationId}`).emit('new_message', { message, conversationId: payload.conversationId });
        for (const participant of conversation.participants) {
          if (String(participant._id || participant) !== String(socket.userId)) {
            io.to(`user:${participant._id || participant}`).emit('notification', {
              type: 'message',
              conversationId: payload.conversationId,
              message,
            });
          }
        }
        ack?.({ success: true, data: { message } });
      } catch (err) {
        ack?.({ success: false, message: err.message });
      }
    });

    socket.on('typing_start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing_start', { conversationId, userId: socket.userId });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing_stop', { conversationId, userId: socket.userId });
    });

    socket.on('message_read', async ({ conversationId }, ack) => {
      try {
        await messageService.markRead({ _id: socket.userId }, conversationId);
        socket.to(`conversation:${conversationId}`).emit('messages_read', { conversationId, userId: socket.userId });
        ack?.({ success: true });
      } catch (err) {
        ack?.({ success: false, message: err.message });
      }
    });

    socket.on('disconnect', async () => {
      const user = await User.findById(socket.userId);
      if (user) {
        user.lastActiveAt = new Date();
        if (user.status === USER_STATUS.ACTIVE) {
          await user.save();
        }
      }
      presenceService.markOffline(socket.userId);
      logger.debug({ userId: socket.userId }, 'socket disconnected');
    });
  });
}
