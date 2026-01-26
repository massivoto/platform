/**
 * ImageHandler - @ai/image
 *
 * Generates images using an AI provider (Gemini/Imagen by default).
 *
 * R-AI-20: Implement image.handler.ts accepting required args: prompt, output
 * R-AI-21: Support optional args: provider, size, style
 * R-AI-22: Resolve {expressions} in prompt (done by interpreter before handler)
 * R-AI-23: Store generated image as base64 string in output variable
 * R-AI-24: Return cost metadata (generation cost) in instruction result
 *
 * @example
 * ```oto
 * @ai/image prompt="A fox in a forest" output=foxImage
 * @ai/image provider="gemini" prompt="Logo for {brand}" size="square" style="illustration" output=logo
 * ```
 */
import { BaseCommandHandler } from '../../command-registry/base-command-handler.js'
import type { ActionResult } from '../../command-registry/action-result.js'
import type { ExecutionContext } from '../../../domain/index.js'
import type { AiProvider, AiProviderName, ImageRequest } from './types.js'
import { DEFAULT_AI_PROVIDER } from './types.js'
import { GeminiProvider } from './providers/gemini.provider.js'

const SUPPORTED_PROVIDERS: AiProviderName[] = ['gemini', 'openai', 'anthropic']

export class ImageHandler extends BaseCommandHandler<string> {
  readonly id = '@ai/image'
  readonly type = 'command' as const

  private providers: Map<string, AiProvider> = new Map()

  /**
   * Set a provider for testing or custom implementations.
   */
  setProvider(name: string, provider: AiProvider): void {
    this.providers.set(name, provider)
  }

  async run(
    args: Record<string, any>,
    context: ExecutionContext,
  ): Promise<ActionResult<string>> {
    // R-AI-20: Validate required prompt argument
    const prompt = args.prompt
    if (prompt === undefined || prompt === null || prompt === '') {
      return this.handleFailure('Prompt is required')
    }

    // R-AI-21: Get optional arguments with defaults
    const providerName: string = args.provider ?? DEFAULT_AI_PROVIDER
    const size: ImageRequest['size'] = args.size ?? 'square'
    const style: ImageRequest['style'] = args.style

    // AC-05: Validate provider
    if (!SUPPORTED_PROVIDERS.includes(providerName as AiProviderName)) {
      return this.handleFailure(
        `Unknown provider "${providerName}". Valid options: ${SUPPORTED_PROVIDERS.join(', ')}`,
      )
    }

    // R-AI-33: Get API key from environment
    const apiKey = this.getApiKey(providerName, context)
    if (!apiKey) {
      return this.handleFailure(
        `Missing GEMINI_API_KEY environment variable. Copy env.dist to .env and add your API key.`,
      )
    }

    // Get or create provider
    let provider = this.providers.get(providerName)
    if (!provider) {
      provider = this.createProvider(providerName, apiKey)
      this.providers.set(providerName, provider)
    }

    try {
      // R-AI-22: Prompt expression resolution is done by interpreter before handler
      const result = await provider.generateImage({
        prompt,
        size,
        style,
      })

      // R-AI-23: Return base64 image as value (interpreter stores in output variable)
      // R-AI-24: Return cost metadata
      return {
        success: true,
        value: result.base64,
        message: `Generated image (${result.costUnits} cost units)`,
        messages: [`Generated image (${result.costUnits} cost units)`],
        cost: result.costUnits,
      }
    } catch (error) {
      // R-AI-43: Handle provider errors gracefully
      const errorMessage = error instanceof Error ? error.message : String(error)
      return this.handleFailure(errorMessage)
    }
  }

  private getApiKey(
    providerName: string,
    context: ExecutionContext,
  ): string | undefined {
    switch (providerName) {
      case 'gemini':
        return context.env?.GEMINI_API_KEY || process.env.GEMINI_API_KEY
      case 'openai':
        return context.env?.OPENAI_API_KEY || process.env.OPENAI_API_KEY
      case 'anthropic':
        return context.env?.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY
      default:
        return undefined
    }
  }

  private createProvider(providerName: string, apiKey: string): AiProvider {
    switch (providerName) {
      case 'gemini':
        return new GeminiProvider(apiKey)
      default:
        // OpenAI and Anthropic are not yet implemented (v1.0)
        throw new Error(`Provider "${providerName}" is not yet implemented`)
    }
  }
}
