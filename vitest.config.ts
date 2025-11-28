/// <reference types="vitest" />
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/lib/importSanitizer.ts',
        'src/lib/import/dateParser.ts',
        'src/lib/import/gestationalCalculator.ts',
        'src/lib/import/tsvProcessor.ts',
        'src/lib/import/htmlFormParser.ts',
        'src/lib/import/types.ts',
        'src/lib/import/index.ts',
        'src/lib/capacityRules.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
