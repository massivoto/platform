import { EnvConfig } from '../env.js'
import { ProviderDriver } from '../types/oauth.js'
import { createGithubDriver } from './github/github.provider.js'
import { createGoogleDriver } from './google/google.provider.js'
import { createMockDriver } from './mock/index.js'

/**
 * Known provider IDs that can be mocked.
 * Google services use the pattern `google-<service>` (e.g., google-gmail, google-calendar).
 * In mock mode, any `google-*` ID is supported dynamically.
 */
const KNOWN_PROVIDERS = ['github', 'google', 'google-gmail', 'google-calendar', 'google-sheets', 'google-drive'] as const

/**
 * Build provider registry based on auth mode
 * In mock mode, creates mock drivers for all known providers
 * In real mode, creates actual OAuth drivers
 */
export function buildProviderRegistry(env: EnvConfig): Map<string, ProviderDriver> {
  if (env.authMode === 'mock') {
    // Create mock drivers for all known providers
    const mockDrivers = KNOWN_PROVIDERS.map((id) => createMockDriver(id, env))
    return new Map(mockDrivers.map((driver) => [driver.config.id, driver]))
  }

  // Real mode: create actual OAuth drivers
  const drivers: ProviderDriver[] = [createGithubDriver(env), createGoogleDriver(env)]
  return new Map(drivers.map((driver) => [driver.config.id, driver]))
}

/**
 * Check if a provider ID matches the Google service pattern.
 * Used for dynamic mock driver creation for unknown Google services.
 */
function isGoogleServiceProvider(id: string): boolean {
  return id.startsWith('google-')
}

/**
 * Get a provider driver by ID.
 * In mock mode with dynamic registry, creates mock drivers on-demand for google-* providers.
 */
export function getProviderDriver(
  registry: Map<string, ProviderDriver>,
  id: string,
  env?: EnvConfig
): ProviderDriver | undefined {
  const driver = registry.get(id)
  if (driver) return driver

  // In mock mode, dynamically create driver for unknown google-* providers
  if (env?.authMode === 'mock' && isGoogleServiceProvider(id)) {
    const mockDriver = createMockDriver(id, env)
    registry.set(id, mockDriver)
    return mockDriver
  }

  return undefined
}
