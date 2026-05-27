// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import awsAmplify from 'astro-aws-amplify';

// https://astro.build/config
export default defineConfig({
  site: 'https://w9helper.com',
  output: 'static',
  adapter: awsAmplify(),
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