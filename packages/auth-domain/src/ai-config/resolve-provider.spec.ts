import { describe, it, expect } from 'vitest'
import { resolveProvider } from './resolve-provider.js'
import type { AiProviderConfig } from './ai-config.js'

/**
 * Theme: Formula One Racing Workshop
 *
 * Marco has multiple AI providers configured. When he runs an @ai/text command,
 * the system intersects his provider priority (AI_PROVIDERS order) with what
 * the handler supports (acceptedProviders). The first match wins.
 */

function makeConfig(...providers: Array<{ name: string; apiKey: string }>): AiProviderConfig {
  return {
    providers: providers.map((p) => ({
      name: p.name as any,
      apiKey: p.apiKey,
    })),
  }
}

describe('resolveProvider', () => {
  describe('R-AIC-21: resolve first matching provider by user priority', () => {
    it('should return the first provider from AI_PROVIDERS that the handler accepts', () => {
      // AC-AIC-03: Marco has AI_PROVIDERS=openai,gemini. Handler accepts [gemini, openai].
      // OpenAI is selected because it has higher user priority.
      const config = makeConfig(
        { name: 'openai', apiKey: 'okey' },
        { name: 'gemini', apiKey: 'gkey' },
      )

      const result = resolveProvider(config, ['gemini', 'openai'])

      expect(result.name).toBe('openai')
      expect(result.apiKey).toBe('okey')
    })

    it('should respect user order when handler supports all', () => {
      const config = makeConfig(
        { name: 'anthropic', apiKey: 'akey' },
        { name: 'gemini', apiKey: 'gkey' },
      )

      const result = resolveProvider(config, ['gemini', 'openai', 'anthropic'])

      expect(result.name).toBe('anthropic')
    })

    it('should skip user providers not in handler accepted list', () => {
      const config = makeConfig(
        { name: 'anthropic', apiKey: 'akey' },
        { name: 'gemini', apiKey: 'gkey' },
      )

      const result = resolveProvider(config, ['gemini'])

      expect(result.name).toBe('gemini')
      expect(result.apiKey).toBe('gkey')
    })

    it('should work with a single provider matching', () => {
      const config = makeConfig({ name: 'gemini', apiKey: 'marco-key' })

      const result = resolveProvider(config, ['gemini'])

      expect(result.name).toBe('gemini')
      expect(result.apiKey).toBe('marco-key')
    })
  })

  describe('R-AIC-22: no compatible provider error', () => {
    it('should throw when no provider matches', () => {
      const config = makeConfig({ name: 'anthropic', apiKey: 'akey' })

      expect(() => resolveProvider(config, ['gemini', 'openai'])).toThrow(
        'No compatible provider for this command. Command accepts: [gemini, openai]. Available providers: [anthropic]',
      )
    })

    it('should include all accepted and available in error message', () => {
      const config = makeConfig(
        { name: 'anthropic', apiKey: 'a' },
        { name: 'openai', apiKey: 'o' },
      )

      expect(() => resolveProvider(config, ['gemini'])).toThrow(
        'No compatible provider for this command. Command accepts: [gemini]. Available providers: [anthropic, openai]',
      )
    })
  })

  describe('R-AIC-23: return both name and API key', () => {
    it('should return an object with name and apiKey', () => {
      const config = makeConfig({ name: 'gemini', apiKey: 'secret-key-123' })

      const result = resolveProvider(config, ['gemini'])

      expect(result).toEqual({ name: 'gemini', apiKey: 'secret-key-123' })
    })
  })
})
