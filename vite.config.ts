import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      $lib: '/src/lib',
    },
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        manualChunks: {
          stix: ['src/lib/stix/parser.ts', 'src/lib/stix/types.ts'],
          storage: ['src/lib/storage/db.ts'],
          taxii: ['src/lib/taxii/client.ts'],
        },
      },
    },
  },
});
