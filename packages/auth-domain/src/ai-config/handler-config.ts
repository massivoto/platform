/**
 * Handler Configuration Loader
 *
 * Reads and validates massivoto.config.json from the project directory.
 * Returns undefined when no config file exists (not an error).
 *
 * R-HC-14 to R-HC-17
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import type { HandlerConfig, CapabilityConfig, AiCapability } from '@massivoto/kit'
import { AI_PROVIDER_KEY_NAMES } from '@massivoto/kit'
import { normalizeProviderName } from './normalize-provider.js'

const CONFIG_FILENAME = 'massivoto.config.json'

const KNOWN_CAPABILITIES: AiCapability[] = ['text', 'image', 'image-analysis', 'embedding']

/**
 * Load handler configuration from massivoto.config.json.
 *
 * @param projectDir - Directory to look for the config file
 * @returns Parsed HandlerConfig or undefined if file does not exist
 * @throws Error if file exists but contains invalid JSON or invalid config
 */
export function loadHandlerConfig(projectDir: string): HandlerConfig | undefined {
  const configPath = path.join(projectDir, CONFIG_FILENAME)

  if (!fs.existsSync(configPath)) {
    return undefined
  }

  let raw: string
  try {
    raw = fs.readFileSync(configPath, 'utf-8')
  } catch (error) {
    throw new Error(
      `Failed to read ${CONFIG_FILENAME}: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error(
      `Invalid JSON in ${configPath}. Check for syntax errors (trailing commas, missing quotes).`
    )
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(
      `${CONFIG_FILENAME} must contain a JSON object, got ${Array.isArray(parsed) ? 'array' : typeof parsed}`
    )
  }

  return validateConfig(parsed as Record<string, unknown>, configPath)
}

function validateConfig(raw: Record<string, unknown>, configPath: string): HandlerConfig {
  const config: HandlerConfig = {}

  if (!raw.ai) {
    return config
  }

  if (typeof raw.ai !== 'object' || raw.ai === null || Array.isArray(raw.ai)) {
    throw new Error(`${configPath}: "ai" must be an object`)
  }

  const aiRaw = raw.ai as Record<string, unknown>
  config.ai = {}

  // Validate per-capability configs
  for (const cap of KNOWN_CAPABILITIES) {
    if (aiRaw[cap] !== undefined) {
      config.ai[cap] = validateCapabilityConfig(aiRaw[cap], `ai.${cap}`, configPath)
    }
  }

  // Validate per-handler overrides
  if (aiRaw.handlers !== undefined) {
    if (typeof aiRaw.handlers !== 'object' || aiRaw.handlers === null || Array.isArray(aiRaw.handlers)) {
      throw new Error(`${configPath}: "ai.handlers" must be an object`)
    }

    config.ai.handlers = {}
    const handlersRaw = aiRaw.handlers as Record<string, unknown>

    for (const [handlerId, handlerConfig] of Object.entries(handlersRaw)) {
      config.ai.handlers[handlerId] = validateCapabilityConfig(
        handlerConfig, `ai.handlers.${handlerId}`, configPath
      )
    }
  }

  return config
}

function validateCapabilityConfig(
  raw: unknown,
  path: string,
  configPath: string,
): CapabilityConfig {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error(`${configPath}: "${path}" must be an object`)
  }

  const obj = raw as Record<string, unknown>

  if (typeof obj.provider !== 'string' || obj.provider.trim() === '') {
    throw new Error(`${configPath}: "${path}.provider" is required and must be a non-empty string`)
  }

  const normalizedProvider = normalizeProviderName(obj.provider)
  if (!normalizedProvider) {
    throw new Error(
      `${configPath}: "${path}.provider" is "${obj.provider}" which is not a known provider. ` +
      `Valid options: ${Object.keys(AI_PROVIDER_KEY_NAMES).join(', ')}`
    )
  }

  const config: CapabilityConfig = {
    provider: normalizedProvider,
  }

  if (obj.model !== undefined) {
    if (typeof obj.model !== 'string') {
      throw new Error(`${configPath}: "${path}.model" must be a string`)
    }
    config.model = obj.model
  }

  if (obj.fallback !== undefined) {
    if (typeof obj.fallback !== 'string') {
      throw new Error(`${configPath}: "${path}.fallback" must be a string`)
    }
    const normalizedFallback = normalizeProviderName(obj.fallback)
    if (!normalizedFallback) {
      throw new Error(
        `${configPath}: "${path}.fallback" is "${obj.fallback}" which is not a known provider. ` +
        `Valid options: ${Object.keys(AI_PROVIDER_KEY_NAMES).join(', ')}`
      )
    }
    config.fallback = normalizedFallback
  }

  return config
}

/**
 * Validate that all providers referenced in the config have API keys available.
 *
 * R-HC-50 to R-HC-52: Startup validation
 *
 * @param config - The loaded handler config
 * @param env - Environment variables with API keys
 * @throws Error with actionable message if a provider is missing its key
 */
export function validateHandlerConfig(
  config: HandlerConfig,
  env: Record<string, string | undefined>,
): void {
  if (!config.ai) return

  const providerKeyNames = AI_PROVIDER_KEY_NAMES as Record<string, string>

  // Check capability configs
  for (const cap of KNOWN_CAPABILITIES) {
    const capConfig = config.ai[cap]
    if (!capConfig) continue

    checkProviderKey(capConfig.provider, `ai.${cap}.provider`, env, providerKeyNames)

    if (capConfig.fallback) {
      checkProviderKey(capConfig.fallback, `ai.${cap}.fallback`, env, providerKeyNames)
    }
  }

  // Check handler overrides
  if (config.ai.handlers) {
    for (const [handlerId, handlerConf] of Object.entries(config.ai.handlers)) {
      checkProviderKey(
        handlerConf.provider,
        `ai.handlers.${handlerId}.provider`,
        env,
        providerKeyNames,
      )

      if (handlerConf.fallback) {
        checkProviderKey(
          handlerConf.fallback,
          `ai.handlers.${handlerId}.fallback`,
          env,
          providerKeyNames,
        )
      }
    }
  }
}

function checkProviderKey(
  provider: string,
  configPath: string,
  env: Record<string, string | undefined>,
  providerKeyNames: Record<string, string>,
): void {
  const keyName = providerKeyNames[provider]
  if (!keyName) return // unknown provider, already validated during load

  const apiKey = env[keyName]
  if (!apiKey) {
    throw new Error(
      `Config error: ${configPath} is set to '${provider}' but ${keyName} is not set. ` +
      `Set it in your .env file or change the provider in massivoto.config.json.`
    )
  }
}
