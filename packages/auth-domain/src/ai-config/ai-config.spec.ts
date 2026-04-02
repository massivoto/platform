import { describe, it, expect } from 'vitest'
import { loadAiConfig } from './ai-config.js'
import type { AiProviderConfig } from './ai-config.js'

/**
 * Theme: Formula One Racing Workshop
 *
 * Marco configures AI providers for his F1 content automation workspace.
 * He sets AI_PROVIDERS and API keys in his .env file.
 *
 * Scenario: Marco has workspace/f1/.env with AI_PROVIDERS=gemini and GEMINI_API_KEY=his-key.
 * The config loader parses this into a validated AiProviderConfig.
 */

describe('loadAiConfig', () => {
  describe('R-AIC-01: parse AI_PROVIDERS as comma-separated list', () => {
    it('should parse a single provider', () => {
      const env = { AI_PROVIDERS: 'gemini', GEMINI_API_KEY: 'marco-key' }

      const config = loadAiConfig(env)

      expect(config.providers).toEqual([
        { name: 'gemini', apiKey: 'marco-key' },
      ])
    })

    it('should parse multiple providers preserving order', () => {
      const env = {
        AI_PROVIDERS: 'openai,gemini',
        OPENAI_API_KEY: 'openai-key',
        GEMINI_API_KEY: 'gemini-key',
      }

      const config = loadAiConfig(env)

      expect(config.providers).toEqual([
        { name: 'openai', apiKey: 'openai-key' },
        { name: 'gemini', apiKey: 'gemini-key' },
      ])
    })

    it('should trim whitespace around provider names', () => {
      const env = {
        AI_PROVIDERS: ' gemini , openai ',
        GEMINI_API_KEY: 'gkey',
        OPENAI_API_KEY: 'okey',
      }

      const config = loadAiConfig(env)

      expect(config.providers.map((p) => p.name)).toEqual(['gemini', 'openai'])
    })

    it('should deduplicate silently', () => {
      const env = {
        AI_PROVIDERS: 'gemini,gemini,openai',
        GEMINI_API_KEY: 'gkey',
        OPENAI_API_KEY: 'okey',
      }

      const config = loadAiConfig(env)

      expect(config.providers.map((p) => p.name)).toEqual(['gemini', 'openai'])
    })
  })

  describe('R-AIC-02: validate provider names', () => {
    it('should accept known providers: gemini, openai, anthropic', () => {
      const env = {
        AI_PROVIDERS: 'gemini,openai,anthropic',
        GEMINI_API_KEY: 'g',
        OPENAI_API_KEY: 'o',
        ANTHROPIC_API_KEY: 'a',
      }

      const config = loadAiConfig(env)

      expect(config.providers).toHaveLength(3)
    })

    it('should fail fast on unknown provider', () => {
      const env = { AI_PROVIDERS: 'gemini,mistral', GEMINI_API_KEY: 'k' }

      expect(() => loadAiConfig(env)).toThrow(
        "Unknown provider 'mistral' in AI_PROVIDERS. Valid options: gemini, openai, anthropic",
      )
    })
  })

  describe('R-AIC-03: verify API keys exist', () => {
    it('should fail fast when API key is missing for listed provider', () => {
      const env = { AI_PROVIDERS: 'gemini' }

      expect(() => loadAiConfig(env)).toThrow(
        "Provider 'gemini' is listed in AI_PROVIDERS but GEMINI_API_KEY is not set. Add it to your .env file",
      )
    })

    it('should fail fast when API key is empty string', () => {
      const env = { AI_PROVIDERS: 'openai', OPENAI_API_KEY: '' }

      expect(() => loadAiConfig(env)).toThrow(
        "Provider 'openai' is listed in AI_PROVIDERS but OPENAI_API_KEY is not set. Add it to your .env file",
      )
    })

    it('should fail on the first provider with missing key', () => {
      const env = {
        AI_PROVIDERS: 'gemini,openai',
        GEMINI_API_KEY: 'ok',
      }

      expect(() => loadAiConfig(env)).toThrow("OPENAI_API_KEY is not set")
    })
  })

  describe('R-AIC-04: AI_PROVIDERS is mandatory', () => {
    it('should fail fast when AI_PROVIDERS is missing', () => {
      const env = {}

      expect(() => loadAiConfig(env)).toThrow(
        'AI_PROVIDERS is required. Set it in your .env file. Example: AI_PROVIDERS=gemini',
      )
    })

    it('should fail fast when AI_PROVIDERS is empty string', () => {
      const env = { AI_PROVIDERS: '' }

      expect(() => loadAiConfig(env)).toThrow(
        'AI_PROVIDERS is required. Set it in your .env file. Example: AI_PROVIDERS=gemini',
      )
    })

    it('should fail fast when AI_PROVIDERS is only whitespace', () => {
      const env = { AI_PROVIDERS: '   ' }

      expect(() => loadAiConfig(env)).toThrow(
        'AI_PROVIDERS is required. Set it in your .env file. Example: AI_PROVIDERS=gemini',
      )
    })
  })
})
