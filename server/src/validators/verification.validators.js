import { z } from 'zod';
import { VERIFICATION_TYPE, VERIFICATION_REQUEST_STATUS, VERIFICATION_LIMITS } from '../config/constants.js';

// Loose international phone format: optional +, 7–20 digits/spaces/dashes/parens.
const phone = z.string().trim().min(7).max(20).regex(/^[+]?[\d\s()-]{7,20}$/, 'Invalid phone number');

export const sendPhoneSchema = z.object({
  body: z.object({ phone: phone.optional() }),
});

export const verifyPhoneSchema = z.object({
  body: z.object({
    code: z
      .string()
      .trim()
      .regex(new RegExp(`^\\d{${VERIFICATION_LIMITS.OTP_LENGTH}}$`), 'Invalid code'),
  }),
});

// Admin-reviewed types only (email/phone are self-serve, not requestable here).
export const submitRequestSchema = z.object({
  body: z.object({
    type: z.enum([VERIFICATION_TYPE.IDENTITY, VERIFICATION_TYPE.DOCUMENT]),
    note: z.string().trim().max(VERIFICATION_LIMITS.NOTE_MAX).optional(),
  }),
});

export const requestIdParam = z.object({
  params: z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id') }),
});

export const adminQueueSchema = z.object({
  query: z.object({
    status: z.enum(Object.values(VERIFICATION_REQUEST_STATUS)).optional(),
    type: z.enum([VERIFICATION_TYPE.IDENTITY, VERIFICATION_TYPE.DOCUMENT]).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
});

export const decisionSchema = z.object({
  params: z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id') }),
  body: z.object({
    decision: z.enum(['approve', 'reject']),
    reviewNote: z.string().trim().max(VERIFICATION_LIMITS.NOTE_MAX).optional(),
  }),
});
