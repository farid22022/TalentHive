import { z } from 'zod';
const oid = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
export const milestoneParam = z.object({ params: z.object({ milestoneId: oid }) });
export const paymentParam = z.object({ params: z.object({ id: oid }) });
export const withdraw = z.object({ body: z.object({ amount: z.number().positive(), method: z.string().trim().min(2).max(50), destinationReference: z.string().trim().min(2).max(300) }) });
