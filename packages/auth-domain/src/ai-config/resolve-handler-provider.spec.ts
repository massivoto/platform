import { describe, it, expect } from 'vitest'
import { resolveHandlerProvider } from './resolve-handler-provider.js'
import type { AiProviderConfig, HandlerConfig, AiProviderName } from '@massivoto/kit'

const ACCEPTED: AiProviderName[] = ['gemini', 'openai', 'anthropic']

const ENV_ALL_KEYS = {
  GEMINI_API_KEY: 'gemini-key',
  OPENAI_API_KEY: 'openai-key',
  ANTHROPIC_API_KEY: 'anthropic-key',
}

const AI_CONFIG: AiProviderConfig = {
  providers: [
    { name: 'gemini', apiKey: 'gemini-key' },
    { name: 'openai', apiKey: 'openai-key' },
  ],
}

describe('resolveHandlerProvider', () => {
  // R-HC-42: L2 handler-specific config wins
  it('should use handler-specific config (L2 handler override)', () => {
    const handlerConfig: HandlerConfig = {
      ai: {
        text: { provider: 'gemini' },
        handlers: {
          '@ai/text': { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
        },
      },
    }

    const result = resolveHandlerProvider(
      '@ai/text', 'text', handlerConfig, AI_CONFIG, ACCEPTED, ENV_ALL_KEYS,
    )

    expect(result.name).toBe('anthropic')
    expect(result.model).toBe('claude-sonnet-4-20250514')
    expect(result.source).toBe('handler-config')
  })

  // R-HC-43: L2 capability config
  it('should use capability config when no handler-specific override', () => {
    const handlerConfig: HandlerConfig = {
      ai: {
        text: { provider: 'openai', model: 'gpt-4o' },
      },
    }

    const result = resolveHandlerProvider(
      '@ai/text', 'text', handlerConfig, AI_CONFIG, ACCEPTED, ENV_ALL_KEYS,
    )

    expect(result.name).toBe('openai')
    expect(result.model).toBe('gpt-4o')
    expect(result.source).toBe('capability-config')
  })

  // R-HC-44: L1 AI_PROVIDERS fallback
  it('should fall back to AI_PROVIDERS when no config', () => {
    const result = resolveHandlerProvider(
      '@ai/text', 'text', undefined, AI_CONFIG, ACCEPTED, ENV_ALL_KEYS,
    )

    expect(result.name).toBe('gemini') // first in AI_CONFIG
    expect(result.source).toBe('ai-providers')
  })

  // R-HC-45: L0 default provider
  it('should fall back to default provider when no AI_PROVIDERS', () => {
    const result = resolveHandlerProvider(
      '@ai/text', 'text', undefined, undefined, ACCEPTED,
      { GEMINI_API_KEY: 'test-key' },
    )

    expect(result.name).toBe('gemini')
    expect(result.source).toBe('default')
  })

  it('should throw when no provider available at all', () => {
    expect(() =>
      resolveHandlerProvider('@ai/text', 'text', undefined, undefined, ACCEPTED, {}),
    ).toThrow('No AI provider available')
  })

  it('should use fallback when primary config provider has no key', () => {
    const handlerConfig: HandlerConfig = {
      ai: {
        text: { provider: 'openai', fallback: 'gemini' },
      },
    }

    const result = resolveHandlerProvider(
      '@ai/text', 'text', handlerConfig, undefined, ACCEPTED,
      { GEMINI_API_KEY: 'gemini-key' }, // no openai key
    )

    expect(result.name).toBe('gemini')
    expect(result.source).toBe('capability-config')
  })

  it('should handle handler-specific fallback', () => {
    const handlerConfig: HandlerConfig = {
      ai: {
        handlers: {
          '@ai/text': { provider: 'anthropic', fallback: 'gemini' },
        },
      },
    }

    const result = resolveHandlerProvider(
      '@ai/text', 'text', handlerConfig, undefined, ACCEPTED,
      { GEMINI_API_KEY: 'gemini-key' }, // no anthropic key
    )

    expect(result.name).toBe('gemini')
    expect(result.source).toBe('handler-config')
  })

  it('should work with undefined capability', () => {
    const result = resolveHandlerProvider(
      '@custom/handler', undefined, undefined, AI_CONFIG, ACCEPTED, ENV_ALL_KEYS,
    )

    expect(result.name).toBe('gemini')
    expect(result.source).toBe('ai-providers')
  })

  it('should skip L2 and use L1 when config has no matching capability', () => {
    const handlerConfig: HandlerConfig = {
      ai: {
        image: { provider: 'openai' },
      },
    }

    const result = resolveHandlerProvider(
      '@ai/text', 'text', handlerConfig, AI_CONFIG, ACCEPTED, ENV_ALL_KEYS,
    )

    expect(result.name).toBe('gemini') // falls through to L1
    expect(result.source).toBe('ai-providers')
  })
})
