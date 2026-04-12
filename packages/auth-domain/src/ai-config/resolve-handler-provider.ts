/**
 * Handler Provider Resolution
 *
 * Resolves which provider and model to use for a handler, following the
 * 4-layer config hierarchy:
 *   L3 (per-command args) > L2 (config file) > L1 (AI_PROVIDERS env) > L0 (hardcoded default)
 *
 * L3 is checked by the handler before calling this function.
 * This function handles L2 -> L1 -> L0 resolution.
 *
 * R-HC-40 to R-HC-45
 */
import type { AiProviderName, AiProviderConfig, AiCapability, HandlerConfig } from '@massivoto/kit'
import { DEFAULT_AI_PROVIDER, deriveApiKeyName } from '@massivoto/kit'
import { resolveProvider, type ResolvedProvider } from './resolve-provider.js'

export interface HandlerProviderResult {
  name: AiProviderName
  apiKey: string
  model?: string
  source: 'handler-config' | 'capability-config' | 'ai-providers' | 'default'
}

/**
 * Resolve provider for a specific handler based on the layered config.
 *
 * Resolution order:
 * 1. L2 handler-specific: handlerConfig.ai.handlers[handlerId]
 * 2. L2 capability: handlerConfig.ai[capability]
 * 3. L1: resolveProvider(aiConfig) -- first configured provider
 * 4. L0: DEFAULT_AI_PROVIDER
 *
 * @param handlerId - Handler identifier (e.g., '@ai/text')
 * @param capability - Handler's declared capability (e.g., 'text')
 * @param handlerConfig - Optional handler config from massivoto.config.json
 * @param aiConfig - Optional AI provider config from .env
 * @param env - Environment variables for API key lookup
 * @returns Resolved provider with name, API key, optional model, and source layer
 */
export function resolveHandlerProvider(
  handlerId: string,
  capability: AiCapability | undefined,
  handlerConfig: HandlerConfig | undefined,
  aiConfig: AiProviderConfig | undefined,
  env: Record<string, string | undefined>,
): HandlerProviderResult {
  // L2: handler-specific override
  if (handlerConfig?.ai?.handlers?.[handlerId]) {
    const handlerConf = handlerConfig.ai.handlers[handlerId]
    const result = resolveFromConfig(handlerConf.provider, handlerConf.model, env)
    if (result) {
      return { ...result, source: 'handler-config' }
    }
    // If handler-specific config fails, try fallback
    if (handlerConf.fallback) {
      const fallbackResult = resolveFromConfig(handlerConf.fallback, undefined, env)
      if (fallbackResult) {
        return { ...fallbackResult, source: 'handler-config' }
      }
    }
  }

  // L2: capability-level config
  if (capability && handlerConfig?.ai?.[capability]) {
    const capConfig = handlerConfig.ai[capability]!
    const result = resolveFromConfig(capConfig.provider, capConfig.model, env)
    if (result) {
      return { ...result, source: 'capability-config' }
    }
    // Try capability fallback
    if (capConfig.fallback) {
      const fallbackResult = resolveFromConfig(capConfig.fallback, undefined, env)
      if (fallbackResult) {
        return { ...fallbackResult, source: 'capability-config' }
      }
    }
  }

  // L1: AI_PROVIDERS resolution
  if (aiConfig && aiConfig.providers.length > 0) {
    try {
      const resolved = resolveProvider(aiConfig)
      return {
        name: resolved.name,
        apiKey: resolved.apiKey,
        source: 'ai-providers',
      }
    } catch {
      // No matching provider in AI_PROVIDERS, fall through to L0
    }
  }

  // L0: Hardcoded default
  const defaultKeyName = deriveApiKeyName(DEFAULT_AI_PROVIDER)
  const defaultApiKey = env[defaultKeyName]
  if (defaultApiKey) {
    return {
      name: DEFAULT_AI_PROVIDER,
      apiKey: defaultApiKey,
      source: 'default',
    }
  }

  throw new Error(
    `No AI provider available. No API key found for default provider '${DEFAULT_AI_PROVIDER}'. ` +
    `Set ${defaultKeyName} in your .env file to get started.`
  )
}

function resolveFromConfig(
  provider: string,
  model: string | undefined,
  env: Record<string, string | undefined>,
): Omit<HandlerProviderResult, 'source'> | undefined {
  const keyName = deriveApiKeyName(provider)
  const apiKey = env[keyName]
  if (!apiKey) return undefined

  return { name: provider, apiKey, model }
}
