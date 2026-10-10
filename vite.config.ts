import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative base so the static build works from any path (GitHub Pages, Vercel).
  base: './',
  build: {
    chunkSizeWarningLimit: 1600, // Phaser alone is ~1.2 MB minified
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
