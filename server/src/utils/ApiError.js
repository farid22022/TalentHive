/** Operational error with HTTP status + machine code. Thrown by services/controllers. */
export class ApiError extends Error {
  constructor(statusCode, message, code = 'ERROR', details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }
  static badRequest(m = 'Bad request', details) { return new ApiError(400, m, 'BAD_REQUEST', details); }
  static unauthorized(m = 'Unauthorized') { return new ApiError(401, m, 'UNAUTHORIZED'); }
  static forbidden(m = 'Forbidden') { return new ApiError(403, m, 'FORBIDDEN'); }
  static notFound(m = 'Not found') { return new ApiError(404, m, 'NOT_FOUND'); }
  static conflict(m = 'Conflict') { return new ApiError(409, m, 'CONFLICT'); }
  static tooMany(m = 'Too many requests') { return new ApiError(429, m, 'RATE_LIMITED'); }
  static internal(m = 'Internal server error') { return new ApiError(500, m, 'INTERNAL'); }
}
