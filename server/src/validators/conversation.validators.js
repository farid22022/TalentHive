import { z } from 'zod';

export const conversationCreateSchema = z.object({
  body: z.object({
    type: z.enum(['general', 'job', 'proposal', 'contract', 'project']).default('general'),
    otherUserId: z.string().optional(),
    job: z.string().optional(),
    proposal: z.string().optional(),
    contract: z.string().optional(),
    project: z.string().optional(),
  }),
});

export const conversationIdParam = z.object({ params: z.object({ conversationId: z.string().min(1) }) });
