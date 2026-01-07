import providerList from '@/mocks/fixtures/providers/providerList.json'

export type Provider = {
  id: string
  name: string
  logo: string
  about: string
}

const providerRegistry: Provider[] = providerList.map((provider) => ({ ...provider }))

// R-BUILD-62: Static synchronous provider registry sourced from fixtures.
export function listProviders(): Provider[] {
  return providerRegistry.map((provider) => ({ ...provider }))
}

export function getProvider(id: string): Provider | undefined {
  return providerRegistry.find((provider) => provider.id === id)
}
