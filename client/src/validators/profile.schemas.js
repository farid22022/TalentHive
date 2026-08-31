import { z } from 'zod';

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .url('Enter a valid URL')
  .optional()
  .or(z.literal(''));

// Step 1 — basics
export const basicsSchema = z.object({
  title: z.string().trim().min(3, 'Add a short headline').max(120),
  category: z.string().trim().min(1, 'Pick a category'),
  overview: z.string().trim().min(50, 'Write at least 50 characters').max(5000),
});

// Step 2 — skills & rate
export const skillsSchema = z.object({
  skills: z.array(z.string().trim().min(1)).min(3, 'Add at least 3 skills').max(30),
  hourlyRate: z.coerce.number({ invalid_type_error: 'Enter a number' }).min(0).max(100000),
  availability: z.enum(['full_time', 'part_time', 'not_available']),
});

// Step 3 — location & languages
export const detailsSchema = z.object({
  location: z.object({
    country: z.string().trim().min(1, 'Country is required').max(80),
    city: z.string().trim().max(80).optional().or(z.literal('')),
    timezone: z.string().trim().max(60).optional().or(z.literal('')),
  }),
  languages: z
    .array(
      z.object({
        name: z.string().trim().min(1, 'Language name required').max(60),
        proficiency: z.enum(['basic', 'conversational', 'fluent', 'native']),
      })
    )
    .min(1, 'Add at least one language')
    .max(15),
  links: z
    .object({ website: optionalUrl, linkedin: optionalUrl, github: optionalUrl })
    .optional(),
});

// Standalone editors (profile page sections)
export const educationItemSchema = z.object({
  school: z.string().trim().min(1, 'School is required').max(150),
  degree: z.string().trim().max(150).optional().or(z.literal('')),
  field: z.string().trim().max(150).optional().or(z.literal('')),
  startYear: z.coerce.number().int().min(1950).max(2100).optional().or(z.literal('')),
  endYear: z.coerce.number().int().min(1950).max(2100).optional().or(z.literal('')),
});

export const experienceItemSchema = z.object({
  company: z.string().trim().min(1, 'Company is required').max(150),
  title: z.string().trim().min(1, 'Title is required').max(150),
  location: z.string().trim().max(150).optional().or(z.literal('')),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  current: z.boolean().optional().default(false),
  description: z.string().trim().max(3000).optional().or(z.literal('')),
});

export const certificationItemSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  issuer: z.string().trim().max(150).optional().or(z.literal('')),
  year: z.coerce.number().int().min(1950).max(2100).optional().or(z.literal('')),
  url: optionalUrl,
});

export const portfolioItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  url: optionalUrl,
  image: z.string().trim().max(500).optional().or(z.literal('')),
  tags: z.array(z.string().trim().min(1)).max(20).optional().default([]),
});
