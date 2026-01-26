/**
 * AI Provider Types
 *
 * R-AI-02: Define AiProvider interface for text and image generation
 * R-AI-30: AiProvider interface with generateText() and generateImage() methods
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
 * AiProvider interface for text and image generation.
 *
 * Implementations: GeminiProvider, (future) OpenAiProvider, AnthropicProvider
 */
export interface AiProvider {
  readonly name: string
  generateText(request: TextRequest): Promise<TextResult>
  generateImage(request: ImageRequest): Promise<ImageResult>
}

/**
 * Supported AI provider names.
 */
export type AiProviderName = 'gemini' | 'openai' | 'anthropic'

/**
 * Default provider for AI commands.
 */
export const DEFAULT_AI_PROVIDER: AiProviderName = 'gemini'
