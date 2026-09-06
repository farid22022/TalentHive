import http from 'node:http';
import { Server as SocketServer } from 'socket.io';
import { createApp } from './app.js';
import { connectDB, disconnectDB, isMemoryServer } from './config/db.js';
import { config } from './config/index.js';
import { logger } from './config/logger.js';
import { registerSocketHandlers } from './sockets/index.js';
import { seedCoreAccounts } from './jobs/seedData.js';
import { seedDemoData } from './jobs/seedDemo.js';

async function start() {
  await connectDB();

  // In dev, ensure the demo accounts and marketplace data exist on the running server.
  // The `npm run seed` script uses its own process (and, when falling back, its own
  // in-memory DB), so its data never reaches this server. Auto-seeding here guarantees
  // the UI has realistic data to browse. Idempotent; skipped in prod and when AUTO_SEED=false.
  if (!config.isProd && process.env.AUTO_SEED !== 'false') {
    try {
      const created = await seedCoreAccounts();
      const demoCounts = await seedDemoData();
      logger.info(
        `Dev auto-seed: ${created} core account(s) created; ${demoCounts.jobs} job(s), ` +
          `${demoCounts.proposals} proposal(s), ${demoCounts.profiles} profile(s) ` +
          `seeded${isMemoryServer() ? ' (in-memory DB)' : ''}. ` +
          `Login with ${config.seed.adminEmail} / ${config.seed.adminPassword}`
      );
    } catch (err) {
      logger.warn({ err }, 'Dev auto-seed failed (non-fatal)');
    }
  }

  const app = createApp();
  const server = http.createServer(app);

  const io = new SocketServer(server, {
    cors: { origin: config.clientUrl, credentials: true },
  });
  registerSocketHandlers(io);
  app.set('io', io);

  server.listen(config.port, () => {
    logger.info(`🚀 TalentHive API listening on http://localhost:${config.port} (${config.env})`);
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down`);
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
