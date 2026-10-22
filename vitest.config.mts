import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // The real "obsidian" package is type-only with no runtime entry.
      // Redirect to our mock (which re-exports commons/testing/obsidian-mock) so imports resolve at test time.
      obsidian: path.resolve(import.meta.dirname, 'tests/__mocks__/obsidian.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    pool: 'vmThreads',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts'],
    },
  },
});