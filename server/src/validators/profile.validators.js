import { z } from 'zod';
import { AVAILABILITY, LANGUAGE_PROFICIENCY, PROFILE_LIMITS } from '../config/constants.js';

const str = (max) => z.string().trim().max(max);
const optUrl = z.string().trim().url().max(500).optional().or(z.literal(''));
const year = z.number().int().min(1950).max(2100);

const languageSchema = z.object({
  name: str(60).min(1),
  proficiency: z.enum(Object.values(LANGUAGE_PROFICIENCY)).default(LANGUAGE_PROFICIENCY.CONVERSATIONAL),
});

const educationSchema = z.object({
  school: str(150).min(1),
  degree: str(150).optional().default(''),
  field: str(150).optional().default(''),
  startYear: year.optional(),
  endYear: year.optional(),
});

const experienceSchema = z.object({
  company: str(150).min(1),
  title: str(150).min(1),
  location: str(150).optional().default(''),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  current: z.boolean().optional().default(false),
  description: str(3000).optional().default(''),
});

const certificationSchema = z.object({
  name: str(200).min(1),
  issuer: str(150).optional().default(''),
  year: year.optional(),
  url: optUrl,
});

const portfolioSchema = z.object({
  title: str(200).min(1),
  description: str(2000).optional().default(''),
  url: optUrl,
  image: str(500).optional().default(''),
  tags: z.array(str(40)).max(20).optional().default([]),
});

// Shared shape for profile updates + onboarding. All fields optional (partial updates).
const profileBody = z.object({
  title: str(120).optional(),
  overview: str(5000).optional(),
  category: str(80).optional(),
  hourlyRate: z.number().min(0).max(100000).optional(),
  availability: z.enum(Object.values(AVAILABILITY)).optional(),
  skills: z.array(str(50).min(1)).max(PROFILE_LIMITS.SKILLS_MAX).optional(),
  languages: z.array(languageSchema).max(PROFILE_LIMITS.LANGUAGES_MAX).optional(),
  location: z
    .object({
      country: str(80).optional().default(''),
      city: str(80).optional().default(''),
      timezone: str(60).optional().default(''),
    })
    .optional(),
  links: z
    .object({
      website: optUrl,
      linkedin: optUrl,
      github: optUrl,
    })
    .optional(),
  education: z.array(educationSchema).max(PROFILE_LIMITS.EDUCATION_MAX).optional(),
  experience: z.array(experienceSchema).max(PROFILE_LIMITS.EXPERIENCE_MAX).optional(),
  certifications: z.array(certificationSchema).max(PROFILE_LIMITS.CERTIFICATIONS_MAX).optional(),
  portfolio: z.array(portfolioSchema).max(PROFILE_LIMITS.PORTFOLIO_MAX).optional(),
  visibility: z.enum(['public', 'private']).optional(),
});

export const updateProfileSchema = z.object({ body: profileBody });
export const onboardingSchema = z.object({ body: profileBody });

export const listTalentSchema = z.object({
  query: z.object({
    q: str(120).optional(),
    category: str(80).optional(),
    skills: z
      .string()
      .optional()
      .transform((v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 10) : undefined)),
    availability: z.enum(Object.values(AVAILABILITY)).optional(),
    minRate: z.coerce.number().min(0).optional(),
    maxRate: z.coerce.number().min(0).optional(),
    sort: z.enum(['recent', 'rate_asc', 'rate_desc', 'complete']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
});

export const objectIdParam = z.object({
  params: z.object({ userId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id') }),
});

export const fileParam = z.object({
  params: z.object({
    kind: z.enum(['images', 'documents', 'misc']),
    name: str(200).min(1),
  }),
});
