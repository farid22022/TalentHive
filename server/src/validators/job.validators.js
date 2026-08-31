import { z } from 'zod';
import {
  CATEGORIES,
  BUDGET_TYPE,
  EXPERIENCE_LEVEL,
  JOB_DURATION,
  JOB_STATUS,
  JOB_LIMITS,
} from '../config/constants.js';

const str = (max) => z.string().trim().max(max);

const budgetSchema = z
  .object({
    type: z.enum(Object.values(BUDGET_TYPE)).optional(),
    min: z.number().min(0).max(JOB_LIMITS.BUDGET_MAX).optional(),
    max: z.number().min(0).max(JOB_LIMITS.BUDGET_MAX).optional(),
    currency: str(3).optional(),
  })
  .optional();

// Full job body used for creation (title/description/category required).
const jobBody = z.object({
  title: str(JOB_LIMITS.TITLE_MAX).min(3),
  description: str(JOB_LIMITS.DESCRIPTION_MAX).min(20),
  category: z.enum(CATEGORIES),
  skills: z.array(str(50).min(1)).max(JOB_LIMITS.SKILLS_MAX).optional().default([]),
  budget: budgetSchema,
  experienceLevel: z.enum(Object.values(EXPERIENCE_LEVEL)).optional(),
  duration: z.enum(Object.values(JOB_DURATION)).optional(),
  // Owner may publish immediately (open) or keep as draft.
  status: z.enum([JOB_STATUS.DRAFT, JOB_STATUS.OPEN]).optional(),
});

export const createJobSchema = z.object({ body: jobBody });

// All fields optional on update; owner may also close/fill via status.
export const updateJobSchema = z.object({
  params: z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id') }),
  body: jobBody.partial().extend({
    status: z.enum(Object.values(JOB_STATUS)).optional(),
  }),
});

export const listJobsSchema = z.object({
  query: z.object({
    q: str(120).optional(),
    category: z.enum(CATEGORIES).optional(),
    skills: z
      .string()
      .optional()
      .transform((v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 10) : undefined)),
    budgetType: z.enum(Object.values(BUDGET_TYPE)).optional(),
    experienceLevel: z.enum(Object.values(EXPERIENCE_LEVEL)).optional(),
    duration: z.enum(Object.values(JOB_DURATION)).optional(),
    minBudget: z.coerce.number().min(0).optional(),
    maxBudget: z.coerce.number().min(0).optional(),
    sort: z.enum(['recent', 'budget_asc', 'budget_desc']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
});

// Owner's own jobs (optionally filtered by status).
export const myJobsSchema = z.object({
  query: z.object({
    status: z.enum(Object.values(JOB_STATUS)).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
});

export const savedJobsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
});

export const jobIdParam = z.object({
  params: z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id') }),
});
