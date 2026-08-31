import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { logger } from '../config/logger.js';
import { seedCoreAccounts } from './seedData.js';

/**
 * Phase 1 seed: development admin + sample client/freelancer accounts.
 * Expanded to full fictional dataset (30 freelancers, 15 clients, jobs, etc.)
 * as those models come online in later phases.
 *
 * NOTE: this runs as its own process. When MONGODB_URI is unreachable and the
 * dev server falls back to in-memory MongoDB, this script seeds a *separate*
 * in-memory instance — the running server won't see it. For that case, the
 * server auto-seeds on startup (see server.js). Point MONGODB_URI at a reachable
 * database to share seeded data across processes.
 */
async function seed() {
  await connectDB();
  logger.info('Seeding development data...');

  const created = await seedCoreAccounts();
  logger.info(`Seed complete: ${created} account(s) created (existing accounts untouched).`);
  logger.warn('DEV ONLY — default passwords. Never use these in production.');

  await disconnectDB();
  await mongoose.disconnect().catch(() => {});
  process.exit(0);
}

seed().catch((err) => {
  logger.error({ err }, 'Seed failed');
  process.exit(1);
});
