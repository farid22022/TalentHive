import dns from 'node:dns';
import mongoose from 'mongoose';
import { config } from './index.js';
import { logger } from './logger.js';

// Give the in-memory MongoDB more time on first run (binary download can exceed 10s).
process.env.MONGOMS_LAUNCH_TIMEOUT = process.env.MONGOMS_LAUNCH_TIMEOUT || '120000';

// `mongodb+srv://` needs a DNS SRV lookup. Some networks' resolvers refuse SRV queries
// (seen as `querySrv ECONNREFUSED`). Setting MONGODB_DNS (e.g. 8.8.8.8,1.1.1.1) routes
// Mongo's DNS through a resolver that supports SRV, without changing the URI.
if (process.env.MONGODB_DNS) {
  const servers = process.env.MONGODB_DNS.split(',').map((s) => s.trim()).filter(Boolean);
  if (servers.length) {
    dns.setServers(servers);
    logger.info(`Using custom DNS resolver(s) for MongoDB SRV: ${servers.join(', ')}`);
  }
}

let memoryServer = null;

/** True when the active connection is an ephemeral in-memory MongoDB (dev). */
export function isMemoryServer() {
  return memoryServer !== null;
}

async function startMemoryServer() {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  const uri = memoryServer.getUri();
  logger.warn('Using in-memory MongoDB (dev only, data is NOT persisted).');
  return uri;
}

/**
 * Connect to MongoDB.
 * - Prod: MONGODB_URI is required.
 * - Dev with MONGODB_URI: try it; if unreachable, fall back to in-memory (so dev never blocks).
 * - Dev without MONGODB_URI: use in-memory directly.
 */
export async function connectDB() {
  mongoose.set('strictQuery', true);
  mongoose.set('sanitizeFilter', true); // blunt operator ($/.) injection

  if (config.isProd) {
    if (!config.mongoUri) throw new Error('MONGODB_URI is required in production');
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 });
    logger.info('MongoDB connected (external).');
  } else if (config.mongoUri) {
    try {
      await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 8000 });
      logger.info('MongoDB connected (external).');
    } catch (err) {
      logger.warn(
        { reason: err?.message },
        'Could not reach MONGODB_URI — falling back to in-memory MongoDB for dev. ' +
          '(Check the URI / network / Atlas IP allowlist, or clear MONGODB_URI to always use in-memory.)'
      );
      const uri = await startMemoryServer();
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    }
  } else {
    const uri = await startMemoryServer();
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  }

  mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB connection error'));
  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.connection.close();
  if (memoryServer) await memoryServer.stop();
}
