import { z } from 'zod';
import { BUDGET_TYPE, PHASE8_LIMITS } from '../config/constants.js';
// Accept normal API strings and ObjectId-shaped JSON payloads, then validate one canonical ID.
const oid = z.preprocess((value) => {
  if (value && typeof value === 'object') {
    const bytes = value.buffer?.data || value.buffer;
    if (Array.isArray(bytes) && bytes.length === 12) return bytes.map((byte) => Number(byte).toString(16).padStart(2, '0')).join('');
    return value.$oid || value.toHexString?.() || value.id || value._id;
  }
  return value;
}, z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id'));
const text = (max) => z.string().trim().max(max);
const milestone = z.object({ title: text(PHASE8_LIMITS.TITLE_MAX).min(2), description: text(PHASE8_LIMITS.DESCRIPTION_MAX).optional(), amount: z.number().min(0).optional(), dueDate: z.coerce.date().optional() });
const offerBody = z.object({ proposal: oid.optional(), job: oid.optional(), freelancer: oid.optional(), contractType: z.enum(Object.values(BUDGET_TYPE)), title: text(PHASE8_LIMITS.TITLE_MAX).min(2), description: text(PHASE8_LIMITS.DESCRIPTION_MAX).min(2), rate: z.number().min(0).optional(), totalBudget: z.number().min(0).optional(), estimatedHours: z.number().min(0).optional(), startDate: z.coerce.date().optional(), endDate: z.coerce.date().optional(), terms: text(PHASE8_LIMITS.TERMS_MAX).optional(), milestones: z.array(milestone).max(PHASE8_LIMITS.MILESTONES_MAX).optional().default([]), expiresAt: z.coerce.date().optional() }).refine((value) => value.proposal || (value.job && value.freelancer), { message: 'proposal or job and freelancer are required', path: ['proposal'] });
export const offerCreate = z.object({ body: offerBody });
export const offerId = z.object({ params: z.object({ id: oid }) });
export const messageBody = z.object({ body: z.object({ message: text(PHASE8_LIMITS.FEEDBACK_MAX).min(3) }) });
export const contractId = z.object({ params: z.object({ id: oid }) });
export const projectId = z.object({ params: z.object({ id: oid }) });
export const milestoneId = z.object({ params: z.object({ id: oid }) });
export const submissionId = z.object({ params: z.object({ id: oid }) });
export const submissionBody = z.object({ body: z.object({ description: text(PHASE8_LIMITS.DESCRIPTION_MAX).min(3), links: z.array(z.string().url()).max(PHASE8_LIMITS.LINKS_MAX).optional().default([]), attachments: z.array(z.object({ name: text(200), url: text(1000), publicId: text(300).optional(), mimeType: text(100), size: z.number().min(0).optional() })).optional().default([]) }) });
export const reviewBody = z.object({ body: z.object({ feedback: text(PHASE8_LIMITS.FEEDBACK_MAX).optional().default('') }) });
