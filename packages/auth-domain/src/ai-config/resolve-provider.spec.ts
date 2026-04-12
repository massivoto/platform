import { describe, it, expect } from 'vitest'
import { resolveProvider } from './resolve-provider.js'
import type { AiProviderConfig } from './ai-config.js'

/**
 * Theme: Formula One Racing Workshop
 *
 * Marco has multiple AI providers configured. resolveProvider picks the first
 * provider from his priority list (AI_PROVIDERS order).
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
  describe('returns first provider from config by user priority', () => {
    it('should return the first provider from AI_PROVIDERS', () => {
      const config = makeConfig(
        { name: 'openai', apiKey: 'okey' },
        { name: 'gemini', apiKey: 'gkey' },
      )

      const result = resolveProvider(config)

      expect(result.name).toBe('openai')
      expect(result.apiKey).toBe('okey')
    })

    it('should respect user order', () => {
      const config = makeConfig(
        { name: 'anthropic', apiKey: 'akey' },
        { name: 'gemini', apiKey: 'gkey' },
      )

      const result = resolveProvider(config)

      expect(result.name).toBe('anthropic')
    })

    it('should work with a single provider', () => {
      const config = makeConfig({ name: 'gemini', apiKey: 'marco-key' })

      const result = resolveProvider(config)

      expect(result.name).toBe('gemini')
      expect(result.apiKey).toBe('marco-key')
    })
  })

  describe('empty config error', () => {
    it('should throw when no providers configured', () => {
      const config: AiProviderConfig = { providers: [] }

      expect(() => resolveProvider(config)).toThrow(
        'No AI provider configured',
      )
    })
  })

  describe('return value shape', () => {
    it('should return an object with name and apiKey', () => {
      const config = makeConfig({ name: 'gemini', apiKey: 'secret-key-123' })

      const result = resolveProvider(config)

      expect(result).toEqual({ name: 'gemini', apiKey: 'secret-key-123' })
    })
  })
})
