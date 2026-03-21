// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import rehypeWrapTables from './src/plugins/rehypeWrapTables';

// https://astro.build/config
export default defineConfig({
  site: "https://aniketh.dev",
  markdown: {
    rehypePlugins: [rehypeWrapTables]
  },
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [react()],
});
