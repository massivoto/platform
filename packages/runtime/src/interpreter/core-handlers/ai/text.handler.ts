/**
 * TextHandler - @ai/text
 *
 * Generates text using an AI provider (Gemini by default).
 *
 * R-AI-10: Implement text.handler.ts accepting required args: prompt, output
 * R-AI-11: Support optional args: provider, model, temperature, maxTokens, system
 * R-AI-12: Resolve {expressions} in prompt (done by interpreter before handler)
 * R-AI-13: Store generated text in output variable via ExecutionContext
 * R-AI-14: Return cost metadata (tokens used) in instruction result
 *
 * @example
 * ```oto
 * @ai/text prompt="Write a tagline for {product}" output=tagline
 * @ai/text provider="gemini" model="gemini-pro" prompt="Summarize {doc}" temperature=0.5 output=summary
 * ```
 */
import { BaseCommandHandler } from '../../command-registry/base-command-handler.js'
import type { ActionResult } from '../../command-registry/action-result.js'
import type { ExecutionContext } from '@massivoto/kit'
import type { AiProvider, AiProviderName } from './types.js'
import { DEFAULT_AI_PROVIDER } from './types.js'
import { GeminiProvider } from './providers/gemini.provider.js'

const SUPPORTED_PROVIDERS: AiProviderName[] = ['gemini', 'openai', 'anthropic']

export class TextHandler extends BaseCommandHandler<string> {
  readonly id = '@ai/text'
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
    // R-AI-10: Validate required prompt argument
    const prompt = args.prompt
    if (prompt === undefined || prompt === null || prompt === '') {
      return this.handleFailure('Prompt is required')
    }

    // R-AI-11: Get optional arguments with defaults
    const providerName: string = args.provider ?? DEFAULT_AI_PROVIDER
    const temperature: number = args.temperature ?? 0.7
    const maxTokens: number | undefined = args.maxTokens
    const system: string | undefined = args.system
    const model: string | undefined = args.model

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
      // R-AI-12: Prompt expression resolution is done by interpreter before handler
      const result = await provider.generateText({
        prompt,
        model,
        temperature,
        maxTokens,
        system,
      })

      // R-AI-13: Return generated text as value (interpreter stores in output variable)
      // R-AI-14: Return cost metadata
      return {
        success: true,
        value: result.text,
        message: `Generated text (${result.tokensUsed} tokens)`,
        messages: [`Generated text (${result.tokensUsed} tokens)`],
        cost: result.tokensUsed,
      }
    } catch (error) {
      // R-AI-43: Handle provider errors gracefully
      const errorMessage =
        error instanceof Error ? error.message : String(error)
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
