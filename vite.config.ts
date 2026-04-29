import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          stix: ['src/lib/stix/index.ts'],
          storage: ['src/lib/storage/index.ts'],
          taxii: ['src/lib/taxii/index.ts'],
        },
      },
    },
  },
});
