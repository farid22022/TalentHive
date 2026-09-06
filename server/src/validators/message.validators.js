import { z } from 'zod';

export const createMessageSchema = z.object({
  params: z.object({ conversationId: z.string().min(1) }),
  body: z.object({
    text: z.string().trim().optional().default(''),
    replyTo: z.string().optional(),
    clientMessageId: z.string().optional(),
    attachments: z.array(z.object({
      name: z.string(),
      url: z.string(),
      publicId: z.string().optional(),
      mimeType: z.string().optional(),
      size: z.number().optional(),
    })).optional().default([]),
  }),
});
