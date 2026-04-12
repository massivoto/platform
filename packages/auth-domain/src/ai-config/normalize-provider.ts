/**
 * Provider Name Normalization
 *
 * Maps user-provided provider name variants to canonical AiProviderName values.
 * Applied at input boundaries: config file load, env parsing, command args.
 *
 * R-HC-20 to R-HC-25
 */
import type { AiProviderName } from '@massivoto/kit'

/**
 * Mapping of lowercase/stripped variants to canonical provider names.
 * All comparisons use lowercase with separators removed.
 */
const PROVIDER_ALIASES: Record<string, AiProviderName> = {
  gemini: 'gemini',
  openai: 'openai',
  anthropic: 'anthropic',
}

/**
 * Normalize a user-provided provider name to canonical AiProviderName.
 *
 * Handles casing variants (openAi, OpenAI, OPENAI) and separator variants
 * (open_ai, open-ai, openai). Returns undefined for unknown provider names.
 *
 * @param input - Raw provider name from user input
 * @returns Canonical AiProviderName or undefined if unrecognized
 *
 * @example
 * normalizeProviderName('openAi')   // 'openai'
 * normalizeProviderName('open_ai')  // 'openai'
 * normalizeProviderName('open-ai')  // 'openai'
 * normalizeProviderName('OpenAI')   // 'openai'
 * normalizeProviderName('Gemini')   // 'gemini'
 * normalizeProviderName('unknown')  // undefined
 */
export function normalizeProviderName(input: string): AiProviderName | undefined {
  // Strip separators (underscores, hyphens) and lowercase
  const normalized = input.replace(/[-_]/g, '').toLowerCase()
  return PROVIDER_ALIASES[normalized]
}
