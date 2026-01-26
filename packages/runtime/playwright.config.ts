/**
 * Playwright configuration for Runtime E2E tests.
 *
 * Tests the full integration of OTO script execution with applets.
 */
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './src/runner/e2e',
  fullyParallel: false, // Sequential execution - tests may share ports
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to avoid port conflicts
  reporter: 'list',
  timeout: 30000, // 30 seconds per test
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
