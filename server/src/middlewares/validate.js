import { ApiError } from '../utils/ApiError.js';

/**
 * Validate a request against a Zod schema shaped { body?, query?, params? }.
 * Replaces req[part] with parsed/coerced data.
 */
export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }));
    return next(new ApiError(422, 'Validation failed', 'VALIDATION_ERROR', details));
  }
  if (result.data.body) req.body = result.data.body;
  if (result.data.query) req.validatedQuery = result.data.query;
  if (result.data.params) req.params = result.data.params;
  next();
};
