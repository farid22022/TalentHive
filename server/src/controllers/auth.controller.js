import { authService } from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/ApiResponse.js';
import { config } from '../config/index.js';

const REFRESH_COOKIE = 'refreshToken';

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
}

const meta = (req) => ({ userAgent: req.headers['user-agent'] || '', ip: req.ip });

export const authController = {
  register: asyncHandler(async (req, res) => {
    const { refreshToken, ...data } = await authService.register(req.body, meta(req));
    setRefreshCookie(res, refreshToken);
    return created(res, data, 'Account created');
  }),

  login: asyncHandler(async (req, res) => {
    const { refreshToken, ...data } = await authService.login(req.body, meta(req));
    setRefreshCookie(res, refreshToken);
    return ok(res, data, 'Logged in');
  }),

  refresh: asyncHandler(async (req, res) => {
    const raw = req.cookies?.refreshToken || req.body?.refreshToken;
    const { refreshToken, ...data } = await authService.refresh(raw, meta(req));
    setRefreshCookie(res, refreshToken);
    return ok(res, data, 'Token refreshed');
  }),

  logout: asyncHandler(async (req, res) => {
    await authService.logout(req.cookies?.refreshToken);
    clearRefreshCookie(res);
    return ok(res, {}, 'Logged out');
  }),

  me: asyncHandler(async (req, res) => ok(res, { user: req.user.toJSON() }, 'OK')),

  changePassword: asyncHandler(async (req, res) => {
    await authService.changePassword(req.user._id, req.body);
    clearRefreshCookie(res);
    return ok(res, {}, 'Password changed — please log in again');
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    const out = await authService.forgotPassword(req.body.email);
    return ok(res, out, 'If that email exists, a reset link has been sent');
  }),

  resetPassword: asyncHandler(async (req, res) => {
    await authService.resetPassword(req.body);
    return ok(res, {}, 'Password reset — you can now log in');
  }),

  verifyEmail: asyncHandler(async (req, res) => {
    await authService.verifyEmail(req.body.token);
    return ok(res, {}, 'Email verified');
  }),

  deleteAccount: asyncHandler(async (req, res) => {
    await authService.deleteAccount(req.user._id);
    clearRefreshCookie(res);
    return ok(res, {}, 'Account deleted');
  }),
};
