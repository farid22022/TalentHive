import dotenv from 'dotenv';
dotenv.config();

const bool = (v, d = false) => (v == null ? d : ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase()));

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || '', // empty => in-memory mongo in dev
  jwt: {
    accessSecret: process.env.JWT_SECRET || 'dev_access_secret_change_me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me',
    accessTtl: process.env.JWT_ACCESS_TTL || '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL || '7d',
  },
  bcryptCost: parseInt(process.env.BCRYPT_COST || '12', 10),
  email: {
    from: process.env.EMAIL_FROM || 'TalentHive <no-reply@talenthive.dev>',
    smtpHost: process.env.SMTP_HOST || '',
  },
  storage: {
    // Provider for generic/document files: 'local' (dev) | 'cloudinary'
    provider: (process.env.STORAGE_PROVIDER || 'local').toLowerCase(),
    cloudinaryName: process.env.CLOUDINARY_CLOUD_NAME || '',
    // Images are uploaded to ImgBB when a key is present (falls back to local otherwise).
    imgbbKey: process.env.IMGBB_API_KEY || '',
    uploadDir: process.env.UPLOAD_DIR || '',
    maxFileMb: parseInt(process.env.MAX_FILE_MB || '10', 10),
  },
  ai: {
    provider: (process.env.AI_PROVIDER || 'mock').toLowerCase(),
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    baseUrl: process.env.AI_BASE_URL || '',
  },
  payment: {
    provider: (process.env.PAYMENT_PROVIDER || 'mock').toLowerCase(),
  },
  seed: {
    adminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@example.com',
    adminPassword: process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!',
  },
  cookieSecure: bool(process.env.COOKIE_SECURE, process.env.NODE_ENV === 'production'),
};

// Fail fast in production if critical secrets are defaults.
if (config.isProd) {
  const weak = [];
  if (config.jwt.accessSecret.includes('dev_')) weak.push('JWT_SECRET');
  if (config.jwt.refreshSecret.includes('dev_')) weak.push('JWT_REFRESH_SECRET');
  if (!config.mongoUri) weak.push('MONGODB_URI');
  if (weak.length) throw new Error(`Insecure/missing config in production: ${weak.join(', ')}`);
}
