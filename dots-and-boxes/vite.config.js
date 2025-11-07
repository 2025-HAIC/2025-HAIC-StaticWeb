import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Using a relative base ensures the production bundle works when served from a
// sub-path such as GitHub Pages (e.g. https://user.github.io/repo-name/).
export default defineConfig({
  plugins: [react()],
  base: './',
});
