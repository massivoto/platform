// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // 60 000 ms  =  1 min
    testTimeout: 1_120_000,
  },
})
