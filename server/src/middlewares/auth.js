import { verifyAccessToken } from '../utils/tokens.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/User.js';
import { USER_STATUS } from '../config/constants.js';

/** Require a valid access token. Loads the user and enforces account status. */
export const requireAuth = async (req, _res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw ApiError.unauthorized('Missing access token');

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw ApiError.unauthorized('Invalid or expired token');
    }

    const user = await User.findById(payload.sub);
    if (!user) throw ApiError.unauthorized('Account not found');
    if (user.status === USER_STATUS.BANNED) throw ApiError.forbidden('Account banned');
    if (user.status === USER_STATUS.SUSPENDED) throw ApiError.forbidden('Account suspended');
    if (user.status === USER_STATUS.DELETED) throw ApiError.unauthorized('Account deleted');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/** Optional auth: attaches req.user if a valid token is present, else continues. */
export const optionalAuth = async (req, _res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return next();
  try {
    const payload = verifyAccessToken(header.slice(7));
    req.user = await User.findById(payload.sub);
  } catch {
    /* ignore */
  }
  next();
};

/** Require one of the given roles. Always enforced server-side. */
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  const allowed = roles.some((r) => req.user.hasRole(r));
  if (!allowed) return next(ApiError.forbidden('Insufficient permissions'));
  next();
};
