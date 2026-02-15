import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // This must match your repository name for GitHub Pages to find JS/CSS files
  base: '/PR-TRACKER-SYSTEM/', 
});
