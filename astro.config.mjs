// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import awsAmplify from 'astro-aws-amplify';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  adapter: awsAmplify(),
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [mdx(), react()],
});