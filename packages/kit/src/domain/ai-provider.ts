/**
 * AI Provider Types
 *
 * Contract interfaces for AI providers (text, image, vision).
 * Implementations live in the interpreter (e.g., GeminiProvider).
 */

/**
 * Request for text generation.
 */
export interface TextRequest {
  prompt: string
  model?: string
  temperature?: number
  maxTokens?: number
  system?: string
}

/**
 * Result of text generation.
 */
export interface TextResult {
  text: string
  tokensUsed: number
}

/**
 * Request for image generation.
 */
export interface ImageRequest {
  prompt: string
  size?: 'square' | 'landscape' | 'portrait'
  style?: 'photo' | 'illustration' | '3d'
}

/**
 * Result of image generation.
 */
export interface ImageResult {
  base64: string
  costUnits: number
}

/**
 * Request for image analysis (vision).
 */
export interface ImageAnalysisRequest {
  image: string        // base64-encoded image
  prompt: string       // instructions for the AI (system prompt)
  model?: string       // model ID or undefined for default
  mimeType?: string    // e.g. "image/png", "image/jpeg" -- defaults to "image/png"
}

/**
 * Result of image analysis.
 */
export interface ImageAnalysisResult {
  text: string         // generated text response
}

/**
 * AiProvider interface for text generation, image generation, and image analysis.
 *
 * Implementations: GeminiProvider, (future) OpenAiProvider, AnthropicProvider
 */
export interface AiProvider {
  readonly name: string
  generateText(request: TextRequest): Promise<TextResult>
  generateImage(request: ImageRequest): Promise<ImageResult>
  analyzeImage(request: ImageAnalysisRequest): Promise<ImageAnalysisResult>
}

/**
 * Supported AI provider names.
 */
export type AiProviderName = 'gemini' | 'openai' | 'anthropic'

/**
 * Default provider for AI commands.
 */
export const DEFAULT_AI_PROVIDER: AiProviderName = 'gemini'

/**
 * Known AI provider names with their expected API key env var.
 */
export const AI_PROVIDER_KEY_NAMES: Record<AiProviderName, string> = {
  gemini: 'GEMINI_API_KEY',
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
}

/**
 * A validated, ready-to-use AI provider entry with its API key.
 * Part of AiProviderConfig loaded at startup from env vars.
 */
export interface AiProviderEntry {
  name: AiProviderName
  apiKey: string
}

/**
 * Validated configuration of available AI providers.
 * Loaded at startup from AI_PROVIDERS + <NAME>_API_KEY env vars.
 * Order reflects user priority (first = highest).
 */
export interface AiProviderConfig {
  providers: AiProviderEntry[]
}

/**
 * Result of resolving a provider from config.
 */
export interface ResolvedProvider {
  name: AiProviderName
  apiKey: string
}

/**
 * Pick the first provider from config that the handler accepts.
 * Order in config.providers reflects user priority (first = highest).
 * Throws if no compatible provider is found.
 */
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

  const available = config.providers.map((p) => p.name)
  throw new Error(
    `No compatible provider for this command. Command accepts: [${acceptedProviders.join(', ')}]. Available providers: [${available.join(', ')}]`,
  )
}
