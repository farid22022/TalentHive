import { z } from 'zod';
import {
  BUDGET_TYPE,
  PROPOSAL_DECISION,
  PROPOSAL_LIMITS,
  PROPOSAL_STATUS,
} from '../config/constants.js';

const str = (max) => z.string().trim().max(max);
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

const bidSchema = z.object({
  amount: z.number().min(0).max(PROPOSAL_LIMITS.BID_MAX),
  type: z.enum(Object.values(BUDGET_TYPE)).optional(),
  currency: str(3).optional(),
});

const milestoneSchema = z.object({
  title: str(PROPOSAL_LIMITS.MILESTONE_TITLE_MAX).min(2),
  amount: z.number().min(0).max(PROPOSAL_LIMITS.BID_MAX).optional(),
  dueDate: z.coerce.date().optional(),
  description: str(PROPOSAL_LIMITS.MILESTONE_DESC_MAX).optional(),
});

const coverLetter = str(PROPOSAL_LIMITS.COVER_LETTER_MAX).min(
  PROPOSAL_LIMITS.COVER_LETTER_MIN,
  `Cover letter must be at least ${PROPOSAL_LIMITS.COVER_LETTER_MIN} characters`
);

const proposalBody = z.object({
  coverLetter,
  bid: bidSchema,
  estimatedDays: z.number().int().min(0).max(PROPOSAL_LIMITS.DAYS_MAX).optional(),
  milestones: z.array(milestoneSchema).max(PROPOSAL_LIMITS.MILESTONES_MAX).optional().default([]),
  aiAssisted: z.boolean().optional(),
});

export const createProposalSchema = z.object({
  body: proposalBody.extend({ job: objectId }),
});

// Authors may revise content while a proposal is still active; status is never client-set here.
export const updateProposalSchema = z.object({
  params: z.object({ id: objectId }),
  body: proposalBody.partial(),
});

// A freelancer's own proposals; `job` lets a job page ask "did I already apply?".
export const myProposalsSchema = z.object({
  query: z.object({
    job: objectId.optional(),
    status: z.enum(Object.values(PROPOSAL_STATUS)).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
});

// Proposals received across the caller's jobs (optionally narrowed to one job).
export const receivedProposalsSchema = z.object({
  query: z.object({
    job: objectId.optional(),
    status: z.enum(Object.values(PROPOSAL_STATUS)).optional(),
    sort: z.enum(['recent', 'bid_asc', 'bid_desc']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
});

export const decisionSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    decision: z.enum(Object.values(PROPOSAL_DECISION)),
    reviewNote: str(PROPOSAL_LIMITS.REVIEW_NOTE_MAX).optional(),
  }),
});

export const proposalIdParam = z.object({ params: z.object({ id: objectId }) });
