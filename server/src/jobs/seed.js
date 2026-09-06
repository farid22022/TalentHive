import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { logger } from '../config/logger.js';
import { seedCoreAccounts } from './seedData.js';
import { seedDemoData } from './seedDemo.js';

/**
 * Development seed: demo accounts plus the fictional marketplace dataset
 * used by the UI in local/dev environments.
 *
 * NOTE: this runs as its own process. When MONGODB_URI is unreachable and the
 * dev server falls back to in-memory MongoDB, this script seeds a separate
 * in-memory instance, so the running server will not see it. For that case, the
 * server auto-seeds on startup (see server.js). Point MONGODB_URI at a reachable
 * database to share seeded data across processes.
 */
async function seed() {
  await connectDB();
  logger.info('Seeding development data...');

  const created = await seedCoreAccounts();
  const demoCounts = await seedDemoData();
  logger.info(
    `Seed complete: ${created} core account(s) created; ` +
      `${demoCounts.users} user records touched, ${demoCounts.profiles} profiles, ` +
      `${demoCounts.jobs} jobs, ${demoCounts.proposals} proposals.`
  );
  logger.warn('DEV ONLY - default passwords. Never use these in production.');

  await disconnectDB();
  await mongoose.disconnect().catch(() => {});
  process.exit(0);
}

seed().catch((err) => {
  logger.error({ err }, 'Seed failed');
  process.exit(1);
});
