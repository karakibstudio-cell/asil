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
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
      legalComments: 'none',
    },
    build: {
      target: 'es2022',
      minify: 'esbuild',
      cssMinify: true,
      assetsInlineLimit: 4096,
      chunkSizeWarningLimit: 600,
      modulePreload: {
        resolveDependencies(filename, deps) {
          return deps.filter(dep => 
            !dep.includes('vendor-pdf') && 
            !dep.includes('vendor-firebase') && 
            !dep.includes('AdminDashboard') &&
            !dep.includes('vendor-charts')
          );
        }
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('preload-helper') || id.includes('commonjsHelpers') || id.includes('\0vite')) {
              return 'vendor-common';
            }
            if (id.includes('node_modules')) {
              if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('canvg') || id.includes('dompurify') || id.includes('fflate')) {
                return 'vendor-pdf';
              }
              if (id.includes('recharts') || id.includes('d3-')) {
                return 'vendor-charts';
              }
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
