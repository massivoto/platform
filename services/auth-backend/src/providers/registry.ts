import { EnvConfig } from '../env.js'
import { ProviderDriver } from '../types/oauth.js'
import { createGithubDriver } from './github/github.provider.js'
import { createGoogleDriver } from './google/google.provider.js'

export function buildProviderRegistry(env: EnvConfig): Map<string, ProviderDriver> {
  const drivers: ProviderDriver[] = [createGithubDriver(env), createGoogleDriver(env)]
  return new Map(drivers.map((driver) => [driver.config.id, driver]))
}

export function getProviderDriver(registry: Map<string, ProviderDriver>, id: string): ProviderDriver | undefined {
  return registry.get(id)
}
