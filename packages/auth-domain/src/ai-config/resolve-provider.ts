import type { AiProviderName, AiProviderConfig } from '@massivoto/kit'

export interface ResolvedProvider {
  name: AiProviderName
  apiKey: string
}

// R-AIC-21 to R-AIC-23
export function resolveProvider(
  config: AiProviderConfig,
  acceptedProviders: AiProviderName[],
): ResolvedProvider {
  const acceptedSet = new Set<string>(acceptedProviders)

  for (const entry of config.providers) {
    if (acceptedSet.has(entry.name)) {
      return { name: entry.name, apiKey: entry.apiKey }
    }
  }

  // R-AIC-22
  const available = config.providers.map((p) => p.name)
  throw new Error(
    `No compatible provider for this command. Command accepts: [${acceptedProviders.join(', ')}]. Available providers: [${available.join(', ')}]`,
  )
}
