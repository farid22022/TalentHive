import { z } from 'zod';
const clean = (value) => {
	if (value == null) return value;
	if (typeof value === 'object') value = value.$oid || value._id || value.id || value;
	return String(value).trim();
};
const oid = z.preprocess(clean, z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id'));
export const milestoneParam = z.object({ params: z.object({ milestoneId: oid }) });
export const paymentParam = z.object({ params: z.object({ id: oid }) });
export const withdraw = z.object({ body: z.object({ amount: z.number().positive(), method: z.string().trim().min(2).max(50), destinationReference: z.string().trim().min(2).max(300) }) });
export const simulatedFund = z.object({ body: z.object({ milestoneId: oid, provider: z.preprocess((value) => clean(value)?.toUpperCase(), z.enum(['BKASH_SIMULATED', 'NAGAD_SIMULATED', 'ROCKET_SIMULATED']).default('BKASH_SIMULATED')), outcome: z.preprocess((value) => clean(value)?.toLowerCase(), z.enum(['success', 'failed']).default('success')) }) });

export const fundBody = z.object({ body: simulatedFund.shape.body.omit({ milestoneId: true }) });
