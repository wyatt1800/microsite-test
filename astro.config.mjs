// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import awsAmplify from 'astro-aws-amplify';
import vercel from '@astrojs/vercel';

// Vercel sets process.env.VERCEL automatically — use the Vercel adapter there.
const adapter = process.env.VERCEL ? vercel() : awsAmplify();

// https://astro.build/config
export default defineConfig({
  site: 'https://w9helper.com',
  output: 'static',
  adapter,
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    mdx(),
    react(),
    sitemap({
      filter: (page) => !page.includes('/api/'),
    }),
  ],
});