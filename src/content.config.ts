import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const guides = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    order: z.number().optional(),
    highlights: z.array(z.string()).optional(),
  }),
});

export const collections = { guides };
