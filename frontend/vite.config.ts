import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // root: 'frontend',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});