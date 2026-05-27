import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
  tailwindcss(),
  ],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8111',
        // target: 'http://106.51.0.210:8111',
        // target: 'http://192.168.1.14:8111',
        // target: 'https://jgpq493j-8111.inc1.devtunnels.ms/api',
        changeOrigin: true,
        secure: false
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
    host: true,
    proxy: {
      '/api': {
        target: 'http://106.51.0.210:8111',
        changeOrigin: true,
        secure: false
      }
    }
  },
});
