import { verifyAccessToken } from '../utils/tokens.js';
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
    // Personal room for user-targeted events (notifications, updates).
    socket.join(`user:${socket.userId}`);
    logger.debug({ userId: socket.userId }, 'socket connected');

    socket.on('disconnect', () => {
      logger.debug({ userId: socket.userId }, 'socket disconnected');
    });
  });
}
