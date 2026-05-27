// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import awsAmplify from 'astro-aws-amplify';

// Vercel sets process.env.VERCEL automatically — skip the AWS adapter there.
const adapter = process.env.VERCEL ? undefined : awsAmplify();

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