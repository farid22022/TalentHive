import rateLimit from 'express-rate-limit';

const message = { success: false, message: 'Too many requests, please try again later.', error: { code: 'RATE_LIMITED' } };

/** General API limiter. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message,
});

/** Stricter limiter for auth-sensitive endpoints (login, register, reset). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message,
});

/** AI feature limiter — cost control, keyed per authenticated user. */
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user ? String(req.user._id) : req.ip),
  message,
});

/** Verification code/email sender limiter — abuse control, keyed per authenticated user. */
export const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user ? String(req.user._id) : req.ip),
  message,
});
