import type { AiProviderName, AiProviderConfig, AiProviderEntry } from '@massivoto/kit'
import { AI_PROVIDER_KEY_NAMES } from '@massivoto/kit'

export type { AiProviderConfig, AiProviderEntry }

const KNOWN_PROVIDERS: AiProviderName[] = ['gemini', 'openai', 'anthropic']

// R-AIC-01 to R-AIC-04
export function loadAiConfig(env: Record<string, string | undefined>): AiProviderConfig {
  const raw = env.AI_PROVIDERS

  // R-AIC-04
  if (!raw || raw.trim() === '') {
    throw new Error(
      'AI_PROVIDERS is required. Set it in your .env file. Example: AI_PROVIDERS=gemini',
    )
  }

  const names = deduplicate(
    raw.split(',').map((s) => s.trim()).filter((s) => s.length > 0),
  )

  const providers: AiProviderEntry[] = []

  for (const name of names) {
    // R-AIC-02
    if (!KNOWN_PROVIDERS.includes(name as AiProviderName)) {
      throw new Error(
        `Unknown provider '${name}' in AI_PROVIDERS. Valid options: ${KNOWN_PROVIDERS.join(', ')}`,
      )
    }

    const providerName = name as AiProviderName
    const keyEnvName = AI_PROVIDER_KEY_NAMES[providerName]
    const apiKey = env[keyEnvName]

    // R-AIC-03
    if (!apiKey) {
      throw new Error(
        `Provider '${providerName}' is listed in AI_PROVIDERS but ${keyEnvName} is not set. Add it to your .env file`,
      )
    }

    providers.push({ name: providerName, apiKey })
  }

  return { providers }
}

function deduplicate(items: string[]): string[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item)) return false
    seen.add(item)
    return true
  })
}
