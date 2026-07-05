import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    svelte(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectRegister: false,
      manifest: false,
      injectManifest: {
        globPatterns: [
          '**/*.{js,css,html,svg,png,webmanifest}',
          'test-bundle-small.json',
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
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
