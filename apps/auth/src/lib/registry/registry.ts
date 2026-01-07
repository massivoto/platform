import type { Provider } from '../providers/provider.types.js'
import providerList from '@/mocks/fixtures/providers/providerList.json'

const providerRegistry: Provider[] = providerList as Provider[]

export function listProviders(): Provider[] {
  return [...providerRegistry]
}

export function getProvider(id: string): Provider | undefined {
  return providerRegistry.find((provider) => provider.id === id)
}
