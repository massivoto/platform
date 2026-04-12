// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Only include src tests, exclude e2e (they use Playwright)
    include: ['src/**/*.spec.ts'],
    exclude: ['**/e2e/**', '**/node_modules/**', '**/dist/**', '**/front/**'],
  },
})
