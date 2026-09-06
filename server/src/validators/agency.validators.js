import { z } from 'zod';
const oid = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const role = z.enum(['member', 'manager', 'admin']);
export const agencyBody = z.object({ body: z.object({ name: z.string().trim().min(2).max(150), tagline: z.string().trim().max(200).optional(), overview: z.string().trim().max(20000).optional(), category: z.string().trim().max(100).optional(), subcategories: z.array(z.string().max(100)).max(20).optional(), skills: z.array(z.string().max(80)).max(40).optional(), visibility: z.enum(['public', 'private', 'unlisted']).optional() }) });
export const agencyPatch = z.object({ params: z.object({ id: oid }), body: agencyBody.shape.body.partial() });
export const agencyId = z.object({ params: z.object({ id: oid }) });
export const slug = z.object({ params: z.object({ slug: z.string().min(2).max(100) }) });
export const invite = z.object({ params: z.object({ id: oid }), body: z.object({ email: z.string().email(), role }) });
export const invitation = z.object({ params: z.object({ id: oid }), body: z.object({ token: z.string().min(20).max(100) }) });
