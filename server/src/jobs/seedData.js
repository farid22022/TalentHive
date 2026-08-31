import { User } from '../models/User.js';
import { ROLES } from '../config/constants.js';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';

/**
 * Idempotently create the development admin + demo accounts.
 * Safe to call repeatedly — existing accounts are left untouched.
 * Returns the number of accounts newly created.
 */
export async function seedCoreAccounts() {
  const accounts = [
    { name: 'Platform Admin', email: config.seed.adminEmail, password: config.seed.adminPassword, role: ROLES.ADMIN },
    { name: 'Demo Freelancer', email: 'freelancer@example.com', password: 'ChangeMe123!', role: ROLES.FREELANCER },
    { name: 'Demo Client', email: 'client@example.com', password: 'ChangeMe123!', role: ROLES.CLIENT },
  ];

  let createdCount = 0;
  for (const acc of accounts) {
    const existing = await User.findOne({ email: acc.email.toLowerCase() });
    if (existing) continue;
    const user = new User({
      name: acc.name,
      email: acc.email,
      role: acc.role,
      roles: [acc.role],
      emailVerified: true,
    });
    await user.setPassword(acc.password);
    await user.save();
    createdCount += 1;
    logger.info(`  + created ${acc.role}: ${acc.email}`);
  }
  return createdCount;
}
