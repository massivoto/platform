import { EnvConfig } from '../env.js'
import { ProviderDriver } from '../types/oauth.js'
import { createGithubDriver } from './github/github.provider.js'
import { createGoogleDriver } from './google/google.provider.js'
import { createMockDriver } from './mock/index.js'

/** Known provider IDs that can be mocked */
const KNOWN_PROVIDERS = ['github', 'google'] as const

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

export function getProviderDriver(registry: Map<string, ProviderDriver>, id: string): ProviderDriver | undefined {
  return registry.get(id)
}
