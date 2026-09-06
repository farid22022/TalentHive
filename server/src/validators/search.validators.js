import { z } from 'zod';
export const query = z.object({ query: z.object({ q: z.string().trim().max(120).optional() }) });
export const savedSearch = z.object({ body: z.object({ name: z.string().trim().min(2).max(100), query: z.string().trim().max(120).optional(), type: z.enum(['jobs', 'freelancers']), filters: z.record(z.any()).optional(), notificationEnabled: z.boolean().optional(), frequency: z.enum(['instant', 'daily', 'weekly', 'disabled']).optional() }) });
export const id = z.object({ params: z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id') }) });
