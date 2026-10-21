import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Required for GitHub Pages: assets resolve correctly under /Dorpon/
  base: '/Dorpon/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/firestore'],
          'vendor-ui': ['lucide-react', 'framer-motion', 'canvas-confetti'],
        },
      },
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});
