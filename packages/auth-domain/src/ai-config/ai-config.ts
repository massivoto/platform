import type { AiProviderConfig, AiProviderEntry } from '@massivoto/kit'
import { deriveApiKeyName } from '@massivoto/kit'

export type { AiProviderConfig, AiProviderEntry }

// R-AIC-01 to R-AIC-04
export function loadAiConfig(env: Record<string, string | undefined>): AiProviderConfig {
  const raw = env.AI_PROVIDERS

  // R-AIC-04
  if (!raw || raw.trim() === '') {
    throw new Error(
      'AI_PROVIDERS is required. Set it in your .env file. Example: AI_PROVIDERS=gemini',
    )
  }

  // Parse "gemini, openai , anthropic" into ['gemini', 'openai', 'anthropic']
  // Split on commas, trim whitespace, drop empty segments, remove duplicates
  const names = deduplicate(
    raw.split(',').map((s) => s.trim()).filter((s) => s.length > 0),
  )

  const providers: AiProviderEntry[] = []

  for (const name of names) {
    // R-PAR-01: Accept any provider name -- derive env key from convention
    const keyEnvName = deriveApiKeyName(name)
    const apiKey = env[keyEnvName]

    // R-AIC-03
    if (!apiKey) {
      throw new Error(
        `Provider '${name}' is listed in AI_PROVIDERS but ${keyEnvName} is not set. Add it to your .env file`,
      )
    }

    providers.push({ name, apiKey })
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
