import { z } from 'zod';
import { AI_FEATURES, AI_LIMITS, PROPOSAL_LIMITS, PROPOSAL_TONE } from '../config/constants.js';

export const analyzeCvSchema = z.object({
  body: z.object({
    text: z.string().trim().max(AI_LIMITS.CV_TEXT_MAX).optional(),
    force: z.coerce.boolean().optional().default(false),
  }),
});

export const listAnalysesSchema = z.object({
  query: z.object({
    feature: z.enum(Object.values(AI_FEATURES)).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
});

export const analysisIdParam = z.object({
  params: z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id') }),
});

// Cover-letter assistant (Phase 6). Output is a draft only — it never creates a proposal.
export const draftProposalSchema = z.object({
  body: z.object({
    job: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id'),
    tone: z.enum(Object.values(PROPOSAL_TONE)).optional(),
    notes: z.string().trim().max(PROPOSAL_LIMITS.AI_NOTES_MAX).optional(),
  }),
});
