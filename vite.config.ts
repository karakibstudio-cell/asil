import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: true,
      port: 3000,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['debugger'] : [],
      legalComments: 'none',
    },
    build: {
      target: 'esnext',
      minify: 'esbuild',
      cssMinify: true,
      assetsInlineLimit: 4096,
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('framer-motion')) {
                return 'vendor-motion';
              }
              if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/') || id.endsWith('react') || id.endsWith('react-dom')) {
                return 'vendor-react';
              }
              if (id.includes('@supabase')) {
                return 'vendor-supabase';
              }
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              return 'vendor-common';
            }
          },
        },
      },
    },
  };
});
