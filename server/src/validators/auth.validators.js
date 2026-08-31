import { z } from 'zod';
import { ROLES } from '../config/constants.js';

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .regex(/[a-z]/, 'Must include a lowercase letter')
  .regex(/[A-Z]/, 'Must include an uppercase letter')
  .regex(/[0-9]/, 'Must include a number');

const email = z.string().email('Invalid email').max(254);

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email,
    password,
    role: z.enum([ROLES.FREELANCER, ROLES.CLIENT]).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({ email, password: z.string().min(1) }),
});

export const changePasswordSchema = z.object({
  body: z.object({ currentPassword: z.string().min(1), newPassword: password }),
});

export const forgotPasswordSchema = z.object({ body: z.object({ email }) });

export const resetPasswordSchema = z.object({
  body: z.object({ token: z.string().min(10), newPassword: password }),
});

export const verifyEmailSchema = z.object({
  body: z.object({ token: z.string().min(10) }),
});
