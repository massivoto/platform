/**
 * Build AI Context - Runtime wiring for AI configuration
 *
 * Loads .env, builds AiProviderConfig, loads HandlerConfig, and
 * validates the configuration at startup. This is the central
 * function that bridges auth-domain config loading with runtime execution.
 *
 * R-HC-01 to R-HC-07
 */
import {
  loadEnvChain,
  loadAiConfig,
  loadHandlerConfig,
  validateHandlerConfig,
} from '@massivoto/auth-domain'
import type { AiProviderConfig } from '@massivoto/kit'
import { DEFAULT_AI_PROVIDER, AI_PROVIDER_KEY_NAMES } from '@massivoto/kit'
import type { HandlerConfig } from '@massivoto/kit'

export interface AiContextResult {
  /** Env vars loaded from .env (merged with process.env for AI keys) */
  env: Record<string, string>
  /** Validated AI provider config from AI_PROVIDERS + API keys */
  aiConfig?: AiProviderConfig
  /** Handler config from massivoto.config.json */
  handlerConfig?: HandlerConfig
  /** Warnings generated during config loading (non-fatal) */
  warnings: string[]
}

/**
 * Build AI context by loading env, AI config, and handler config.
 *
 * This function is designed to be resilient:
 * - Missing .env is not an error (uses process.env as fallback)
 * - Missing AI_PROVIDERS is not an error (auto-detects from available keys)
 * - Missing massivoto.config.json is not an error (returns undefined handlerConfig)
 * - Invalid massivoto.config.json IS an error (fail-fast)
 * - Zero API keys produces a warning, not an error
 *
 * @param projectDir - Directory containing .env and massivoto.config.json
 * @param rootDir - Root directory for .env search chain (defaults to projectDir)
 */
export function buildAiContext(
  projectDir: string,
  rootDir?: string,
): AiContextResult {
  const warnings: string[] = []
  const effectiveRoot = rootDir ?? projectDir

  // Step 1: Load env vars from .env chain
  let envVars: Record<string, string> = {}
  try {
    envVars = loadEnvChain(projectDir, effectiveRoot)
  } catch (error) {
    warnings.push(
      `Failed to load .env: ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  // Merge with process.env for AI-related keys (env file takes priority)
  const mergedEnv: Record<string, string> = { ...envVars }
  for (const keyName of Object.values(AI_PROVIDER_KEY_NAMES)) {
    if (!mergedEnv[keyName] && process.env[keyName]) {
      mergedEnv[keyName] = process.env[keyName]!
    }
  }

  // Step 2: Build AI provider config
  let aiConfig: AiProviderConfig | undefined
  try {
    aiConfig = loadAiConfig(mergedEnv)
  } catch {
    // AI_PROVIDERS not set or invalid -- try auto-detect from available keys
    aiConfig = autoDetectProviders(mergedEnv)
    if (aiConfig && aiConfig.providers.length > 0) {
      warnings.push(
        'AI_PROVIDERS not set in .env. Auto-detected providers from available API keys: ' +
        aiConfig.providers.map((p) => p.name).join(', '),
      )
    }
  }

  // R-HC-05: Zero API keys warning
  if (!aiConfig || aiConfig.providers.length === 0) {
    warnings.push(
      'No AI API keys found. Set GEMINI_API_KEY in your .env file to get started. ' +
      'Get a free Gemini API key at https://aistudio.google.com/apikey',
    )
  }

  // Step 3: Load handler config from massivoto.config.json
  let handlerConfig: HandlerConfig | undefined
  try {
    handlerConfig = loadHandlerConfig(projectDir)
  } catch (error) {
    // Invalid config file is a real error -- fail fast
    throw error
  }

  // Step 4: Validate handler config against available env
  if (handlerConfig) {
    validateHandlerConfig(handlerConfig, mergedEnv)
  }

  return { env: mergedEnv, aiConfig, handlerConfig, warnings }
}

/**
 * R-HC-04: Auto-detect providers from available API keys.
 * When AI_PROVIDERS is not set, scan for known API key env vars.
 */
function autoDetectProviders(
  env: Record<string, string | undefined>,
): AiProviderConfig | undefined {
  const providerKeyNames = AI_PROVIDER_KEY_NAMES as Record<string, string>
  const providers: Array<{ name: 'gemini' | 'openai' | 'anthropic'; apiKey: string }> = []

  // Check in default priority order
  const defaultOrder: Array<'gemini' | 'openai' | 'anthropic'> = [
    DEFAULT_AI_PROVIDER as 'gemini',
    ...(['gemini', 'openai', 'anthropic'] as const).filter((p) => p !== DEFAULT_AI_PROVIDER),
  ]

  for (const name of defaultOrder) {
    const keyName = providerKeyNames[name]
    const apiKey = env[keyName]
    if (apiKey) {
      providers.push({ name, apiKey })
    }
  }

  if (providers.length === 0) {
    return undefined
  }

  return { providers }
}
