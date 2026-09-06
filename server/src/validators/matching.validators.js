import { z } from 'zod';
const oid = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
export const jobParam = z.object({ params: z.object({ jobId: oid }) });
