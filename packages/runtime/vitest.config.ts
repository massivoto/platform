// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // 60 000 ms  =  1 min
    testTimeout: 1_120_000,
    // Only include src tests, exclude e2e (they use Playwright)
    include: ['src/**/*.spec.ts'],
    exclude: ['**/e2e/**', '**/node_modules/**', '**/dist/**'],
  },
})
