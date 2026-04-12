import { describe, it, expect } from 'vitest'
import { normalizeProviderName } from './normalize-provider.js'

describe('normalizeProviderName', () => {
  // R-HC-22: Gemini variants
  it('should normalize gemini variants', () => {
    expect(normalizeProviderName('gemini')).toBe('gemini')
    expect(normalizeProviderName('Gemini')).toBe('gemini')
    expect(normalizeProviderName('GEMINI')).toBe('gemini')
  })

  // R-HC-21: OpenAI variants
  it('should normalize openai variants', () => {
    expect(normalizeProviderName('openai')).toBe('openai')
    expect(normalizeProviderName('openAi')).toBe('openai')
    expect(normalizeProviderName('OpenAI')).toBe('openai')
    expect(normalizeProviderName('OPENAI')).toBe('openai')
    expect(normalizeProviderName('open_ai')).toBe('openai')
    expect(normalizeProviderName('open-ai')).toBe('openai')
    expect(normalizeProviderName('Open_AI')).toBe('openai')
    expect(normalizeProviderName('Open-Ai')).toBe('openai')
  })

  // R-HC-23: Anthropic variants
  it('should normalize anthropic variants', () => {
    expect(normalizeProviderName('anthropic')).toBe('anthropic')
    expect(normalizeProviderName('Anthropic')).toBe('anthropic')
    expect(normalizeProviderName('ANTHROPIC')).toBe('anthropic')
  })

  // R-HC-24: Unknown provider names -- return normalized form, not undefined
  it('should return normalized form for unknown providers', () => {
    expect(normalizeProviderName('huggingface')).toBe('huggingface')
    expect(normalizeProviderName('cohere')).toBe('cohere')
    expect(normalizeProviderName('')).toBe('')
    expect(normalizeProviderName('Mistral')).toBe('mistral')
    expect(normalizeProviderName('hugging_face')).toBe('huggingface')
  })
})
