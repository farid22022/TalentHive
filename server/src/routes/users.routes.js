import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/ApiResponse.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { User } from '../models/User.js';

const router = Router();

const updateMeSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    avatar: z.string().url().optional().or(z.literal('')),
    phone: z.string().max(30).optional(),
  }),
});

// Update own basic account fields.
router.patch(
  '/me',
  requireAuth,
  validate(updateMeSchema),
  asyncHandler(async (req, res) => {
    const allowed = ['name', 'avatar', 'phone'];
    for (const k of allowed) if (req.body[k] !== undefined) req.user[k] = req.body[k];
    await req.user.save();
    return ok(res, { user: req.user.toJSON() }, 'Profile updated');
  })
);

export default router;
