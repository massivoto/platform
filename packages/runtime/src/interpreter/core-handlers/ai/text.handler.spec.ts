import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TextHandler } from './text.handler.js'
import type { AiProvider, TextResult } from './types.js'

/**
 * Test file: text.handler.spec.ts
 * Theme: Social Media Automation (Emma, Carlos, taglines, summaries)
 *
 * Tests for @ai/text handler (R-AI-10 to R-AI-14)
 */

function createMockProvider(result: TextResult): AiProvider {
  return {
    name: 'mock',
    generateText: vi.fn().mockResolvedValue(result),
    generateImage: vi.fn().mockResolvedValue({ base64: '', costUnits: 0 }),
  }
}

describe('TextHandler', () => {
  describe('R-AI-10: handler registration and required args', () => {
    it('should have id property set to @ai/text', () => {
      const handler = new TextHandler()

      expect(handler.id).toBe('@ai/text')
    })

    it('should have type property set to command', () => {
      const handler = new TextHandler()

      expect(handler.type).toBe('command')
    })

    it('should have init() method', async () => {
      const handler = new TextHandler()

      await expect(handler.init()).resolves.toBeUndefined()
    })

    it('should have dispose() method', async () => {
      const handler = new TextHandler()

      await expect(handler.dispose()).resolves.toBeUndefined()
    })

    it('should fail when prompt is missing', async () => {
      const handler = new TextHandler()
      const context = createEmptyExecutionContext('emma-123')

      const result = await handler.run({}, context)

      expect(result.success).toBe(false)
      expect(result.fatalError).toBe('Prompt is required')
    })

    it('should fail when prompt is undefined', async () => {
      const handler = new TextHandler()
      const context = createEmptyExecutionContext('emma-123')

      const result = await handler.run({ prompt: undefined }, context)

      expect(result.success).toBe(false)
      expect(result.fatalError).toBe('Prompt is required')
    })

    it('should fail when prompt is empty string', async () => {
      const handler = new TextHandler()
      const context = createEmptyExecutionContext('emma-123')

      const result = await handler.run({ prompt: '' }, context)

      expect(result.success).toBe(false)
      expect(result.fatalError).toBe('Prompt is required')
    })
  })

  describe('R-AI-11: optional arguments with defaults', () => {
    it('should use gemini as default provider', async () => {
      const handler = new TextHandler()
      const context = createEmptyExecutionContext('emma-123')
      context.env = { GEMINI_API_KEY: 'test-key' }
      const mockProvider = createMockProvider({
        text: 'Massivoto: Automate Everything',
        tokensUsed: 10,
      })
      handler.setProvider('gemini', mockProvider)

      await handler.run({ prompt: 'Write a tagline for Massivoto' }, context)

      expect(mockProvider.generateText).toHaveBeenCalled()
    })

    it('should use default temperature of 0.7', async () => {
      const handler = new TextHandler()
      const context = createEmptyExecutionContext('emma-123')
      context.env = { GEMINI_API_KEY: 'test-key' }
      const mockProvider = createMockProvider({
        text: 'Generated text',
        tokensUsed: 5,
      })
      handler.setProvider('gemini', mockProvider)

      await handler.run({ prompt: 'Write something' }, context)

      expect(mockProvider.generateText).toHaveBeenCalledWith(
        expect.objectContaining({ temperature: 0.7 }),
      )
    })

    it('should allow custom temperature', async () => {
      const handler = new TextHandler()
      const context = createEmptyExecutionContext('emma-123')
      context.env = { GEMINI_API_KEY: 'test-key' }
      const mockProvider = createMockProvider({
        text: 'Generated text',
        tokensUsed: 5,
      })
      handler.setProvider('gemini', mockProvider)

      await handler.run(
        { prompt: 'Write something', temperature: 0.2 },
        context,
      )

      expect(mockProvider.generateText).toHaveBeenCalledWith(
        expect.objectContaining({ temperature: 0.2 }),
      )
    })

    it('should pass maxTokens when provided', async () => {
      const handler = new TextHandler()
      const context = createEmptyExecutionContext('emma-123')
      context.env = { GEMINI_API_KEY: 'test-key' }
      const mockProvider = createMockProvider({
        text: 'Generated text',
        tokensUsed: 5,
      })
      handler.setProvider('gemini', mockProvider)

      await handler.run({ prompt: 'Write something', maxTokens: 100 }, context)

      expect(mockProvider.generateText).toHaveBeenCalledWith(
        expect.objectContaining({ maxTokens: 100 }),
      )
    })

    it('should pass system prompt when provided', async () => {
      const handler = new TextHandler()
      const context = createEmptyExecutionContext('emma-123')
      context.env = { GEMINI_API_KEY: 'test-key' }
      const mockProvider = createMockProvider({
        text: 'Generated text',
        tokensUsed: 5,
      })
      handler.setProvider('gemini', mockProvider)

      await handler.run(
        { prompt: 'Write something', system: 'You are a marketing expert' },
        context,
      )

      expect(mockProvider.generateText).toHaveBeenCalledWith(
        expect.objectContaining({ system: 'You are a marketing expert' }),
      )
    })

    it('should pass model when provided', async () => {
      const handler = new TextHandler()
      const context = createEmptyExecutionContext('emma-123')
      context.env = { GEMINI_API_KEY: 'test-key' }
      const mockProvider = createMockProvider({
        text: 'Generated text',
        tokensUsed: 5,
      })
      handler.setProvider('gemini', mockProvider)

      await handler.run(
        { prompt: 'Write something', model: 'gemini-pro' },
        context,
      )

      expect(mockProvider.generateText).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gemini-pro' }),
      )
    })
  })

  describe('R-AI-12: expression resolution in prompt', () => {
    it('should pass the prompt string directly to provider', async () => {
      const handler = new TextHandler()
      const context = createEmptyExecutionContext('emma-123')
      context.env = { GEMINI_API_KEY: 'test-key' }
      const mockProvider = createMockProvider({
        text: 'Massivoto: Scale Your Workflow',
        tokensUsed: 8,
      })
      handler.setProvider('gemini', mockProvider)

      // Note: Expression resolution happens in the interpreter before the handler is called
      // The handler receives the already-resolved prompt
      await handler.run({ prompt: 'Write a tagline for Massivoto' }, context)

      expect(mockProvider.generateText).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: 'Write a tagline for Massivoto' }),
      )
    })
  })

  describe('R-AI-13: stores generated text in output variable', () => {
    it('should return generated text as value', async () => {
      const handler = new TextHandler()
      const context = createEmptyExecutionContext('emma-123')
      context.env = { GEMINI_API_KEY: 'test-key' }
      const mockProvider = createMockProvider({
        text: 'Emma loves automation',
        tokensUsed: 5,
      })
      handler.setProvider('gemini', mockProvider)

      const result = await handler.run({ prompt: 'Write about Emma' }, context)

      expect(result.success).toBe(true)
      expect(result.value).toBe('Emma loves automation')
    })
  })

  describe('R-AI-14: returns cost metadata (tokens used)', () => {
    it('should return cost based on tokens used', async () => {
      const handler = new TextHandler()
      const context = createEmptyExecutionContext('emma-123')
      context.env = { GEMINI_API_KEY: 'test-key' }
      const mockProvider = createMockProvider({
        text: 'Generated text',
        tokensUsed: 100,
      })
      handler.setProvider('gemini', mockProvider)

      const result = await handler.run({ prompt: 'Write something' }, context)

      expect(result.cost).toBe(100)
    })

    it('should include tokens in message', async () => {
      const handler = new TextHandler()
      const context = createEmptyExecutionContext('emma-123')
      context.env = { GEMINI_API_KEY: 'test-key' }
      const mockProvider = createMockProvider({
        text: 'Generated text',
        tokensUsed: 42,
      })
      handler.setProvider('gemini', mockProvider)

      const result = await handler.run({ prompt: 'Write something' }, context)

      expect(result.messages).toContainEqual(expect.stringContaining('42'))
    })
  })

  describe('R-AI-33: API key from environment', () => {
    it('should fail when GEMINI_API_KEY is missing', async () => {
      const handler = new TextHandler()
      const context = createEmptyExecutionContext('emma-123')
      context.env = {} // No API key

      const result = await handler.run({ prompt: 'Write something' }, context)

      expect(result.success).toBe(false)
      expect(result.fatalError).toContain('GEMINI_API_KEY')
    })

    it('should fail with actionable error message for missing key', async () => {
      const handler = new TextHandler()
      const context = createEmptyExecutionContext('emma-123')
      context.env = {}

      const result = await handler.run({ prompt: 'Write something' }, context)

      expect(result.fatalError).toContain('env.dist')
    })
  })

  describe('AC-05: unknown provider error', () => {
    it('should fail with clear error for unknown provider', async () => {
      const handler = new TextHandler()
      const context = createEmptyExecutionContext('emma-123')
      context.env = { GEMINI_API_KEY: 'test-key' }

      const result = await handler.run(
        { prompt: 'Write something', provider: 'unknown-provider' },
        context,
      )

      expect(result.success).toBe(false)
      expect(result.fatalError).toContain('unknown-provider')
      expect(result.fatalError).toContain('gemini')
    })
  })

  describe('R-AI-43: error handling', () => {
    it('should handle provider errors gracefully', async () => {
      const handler = new TextHandler()
      const context = createEmptyExecutionContext('emma-123')
      context.env = { GEMINI_API_KEY: 'test-key' }
      const mockProvider: AiProvider = {
        name: 'mock',
        generateText: vi
          .fn()
          .mockRejectedValue(new Error('Rate limit exceeded')),
        generateImage: vi.fn().mockResolvedValue({ base64: '', costUnits: 0 }),
      }
      handler.setProvider('gemini', mockProvider)

      const result = await handler.run({ prompt: 'Write something' }, context)

      expect(result.success).toBe(false)
      expect(result.fatalError).toContain('Rate limit exceeded')
    })
  })
})
