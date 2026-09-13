import { startPaymentWorker } from './services/payment.service.js';
import http from 'node:http';
import { Server as SocketServer } from 'socket.io';
import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { config } from './config/index.js';
import { logger } from './config/logger.js';
import { registerSocketHandlers } from './sockets/index.js';

async function start() {
  if (!config.mongoUri) throw new Error('MONGODB_URI is required to start the web server');
  await connectDB();

  const app = createApp();
  const server = http.createServer(app);

  const io = new SocketServer(server, {
    cors: { origin: config.clientUrl, credentials: true },
  });
  registerSocketHandlers(io);
  app.set('io', io);
  const stopPaymentWorker = startPaymentWorker(io);

  server.listen(config.port, () => {
    logger.info(`🚀 TalentHive API listening on http://localhost:${config.port} (${config.env})`);
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down`);
    stopPaymentWorker();
    io.close();
    await new Promise((resolve) => server.close(resolve));
    await disconnectDB();
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});
