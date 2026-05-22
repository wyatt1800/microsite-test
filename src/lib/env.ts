import { z } from 'astro:content';

const envSchema = z.object({
  // Analytics (public — safe to expose to browser)
  PUBLIC_GA4_MEASUREMENT_ID: z.string().min(1).optional(),
  PUBLIC_GTM_CONTAINER_ID: z.string().min(1).optional(),

  // SendGrid — non-PUBLIC so it never reaches the client
  SENDGRID_API_KEY: z.string().min(1).optional(),
});

export const env = envSchema.parse(import.meta.env);
