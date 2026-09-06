import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';
import { config } from '../config/index.js';

/** 404 for unmatched routes. */
export const notFound = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/** Global error handler → consistent error envelope. Never leaks stack in prod. */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  let error = err;

  // Normalize common non-ApiError errors.
  if (!(error instanceof ApiError)) {
    if (error?.name === 'ValidationError') {
      error = new ApiError(422, 'Validation failed', 'VALIDATION_ERROR',
        Object.values(error.errors).map((e) => ({ path: e.path, message: e.message })));
    } else if (error?.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0] || 'field';
      error = new ApiError(409, `${field} already in use`, 'DUPLICATE');
    } else if (error?.name === 'CastError') {
      error = new ApiError(400, `Invalid identifier${error.path ? ` (${error.path})` : ''}`, 'BAD_REQUEST', config.isProd ? undefined : { path: error.path, value: String(error.value ?? '') });
    } else {
      error = new ApiError(500, config.isProd ? 'Internal server error' : String(err?.message || err), 'INTERNAL');
    }
  }

  if (error.statusCode >= 500) logger.error({ err, path: req.originalUrl }, 'Unhandled error');

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    error: {
      code: error.code,
      details: error.details,
      ...(config.isProd ? {} : { stack: err?.stack }),
    },
  });
};
