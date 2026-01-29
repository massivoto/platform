import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ImageHandler } from './image.handler.js'
import { createEmptyExecutionContext } from ''@massivoto/kit'
import type { AiProvider, ImageResult } from './types.js'

/**
 * Test file: image.handler.spec.ts
 * Theme: Social Media Automation (Emma, Carlos, logos, illustrations)
 *
 * Tests for @ai/image handler (R-AI-20 to R-AI-24)
 */

function createMockProvider(result: ImageResult): AiProvider {
  return {
    name: 'mock',
    generateText: vi.fn().mockResolvedValue({ text: '', tokensUsed: 0 }),
    generateImage: vi.fn().mockResolvedValue(result),
  }
}

describe('ImageHandler', () => {
  describe('R-AI-20: handler registration and required args', () => {
    it('should have id property set to @ai/image', () => {
      const handler = new ImageHandler()

      expect(handler.id).toBe('@ai/image')
    })

    it('should have type property set to command', () => {
      const handler = new ImageHandler()

      expect(handler.type).toBe('command')
    })

    it('should have init() method', async () => {
      const handler = new ImageHandler()

      await expect(handler.init()).resolves.toBeUndefined()
    })

    it('should have dispose() method', async () => {
      const handler = new ImageHandler()

      await expect(handler.dispose()).resolves.toBeUndefined()
    })

    it('should fail when prompt is missing', async () => {
      const handler = new ImageHandler()
      const context = createEmptyExecutionContext('emma-123')

      const result = await handler.run({}, context)

      expect(result.success).toBe(false)
      expect(result.fatalError).toBe('Prompt is required')
    })

    it('should fail when prompt is undefined', async () => {
      const handler = new ImageHandler()
      const context = createEmptyExecutionContext('emma-123')

      const result = await handler.run({ prompt: undefined }, context)

      expect(result.success).toBe(false)
      expect(result.fatalError).toBe('Prompt is required')
    })

    it('should fail when prompt is empty string', async () => {
      const handler = new ImageHandler()
      const context = createEmptyExecutionContext('emma-123')

      const result = await handler.run({ prompt: '' }, context)

      expect(result.success).toBe(false)
      expect(result.fatalError).toBe('Prompt is required')
    })
  })

  describe('R-AI-21: optional arguments with defaults', () => {
    it('should use gemini as default provider', async () => {
      const handler = new ImageHandler()
      const context = createEmptyExecutionContext('emma-123')
      context.env = { GEMINI_API_KEY: 'test-key' }
      const mockProvider = createMockProvider({
        base64: 'aW1hZ2VfZGF0YQ==',
        costUnits: 1,
      })
      handler.setProvider('gemini', mockProvider)

      await handler.run({ prompt: 'A fox in a forest' }, context)

      expect(mockProvider.generateImage).toHaveBeenCalled()
    })

    it('should use square as default size', async () => {
      const handler = new ImageHandler()
      const context = createEmptyExecutionContext('emma-123')
      context.env = { GEMINI_API_KEY: 'test-key' }
      const mockProvider = createMockProvider({
        base64: 'aW1hZ2VfZGF0YQ==',
        costUnits: 1,
      })
      handler.setProvider('gemini', mockProvider)

      await handler.run({ prompt: 'A logo' }, context)

      expect(mockProvider.generateImage).toHaveBeenCalledWith(
        expect.objectContaining({ size: 'square' }),
      )
    })

    it('should allow custom size', async () => {
      const handler = new ImageHandler()
      const context = createEmptyExecutionContext('emma-123')
      context.env = { GEMINI_API_KEY: 'test-key' }
      const mockProvider = createMockProvider({
        base64: 'aW1hZ2VfZGF0YQ==',
        costUnits: 1,
      })
      handler.setProvider('gemini', mockProvider)

      await handler.run({ prompt: 'A banner', size: 'landscape' }, context)

      expect(mockProvider.generateImage).toHaveBeenCalledWith(
        expect.objectContaining({ size: 'landscape' }),
      )
    })

    it('should pass style when provided', async () => {
      const handler = new ImageHandler()
      const context = createEmptyExecutionContext('emma-123')
      context.env = { GEMINI_API_KEY: 'test-key' }
      const mockProvider = createMockProvider({
        base64: 'aW1hZ2VfZGF0YQ==',
        costUnits: 1,
      })
      handler.setProvider('gemini', mockProvider)

      await handler.run({ prompt: 'A mascot', style: 'illustration' }, context)

      expect(mockProvider.generateImage).toHaveBeenCalledWith(
        expect.objectContaining({ style: 'illustration' }),
      )
    })

    it('should support portrait size', async () => {
      const handler = new ImageHandler()
      const context = createEmptyExecutionContext('emma-123')
      context.env = { GEMINI_API_KEY: 'test-key' }
      const mockProvider = createMockProvider({
        base64: 'aW1hZ2VfZGF0YQ==',
        costUnits: 1,
      })
      handler.setProvider('gemini', mockProvider)

      await handler.run({ prompt: 'A portrait', size: 'portrait' }, context)

      expect(mockProvider.generateImage).toHaveBeenCalledWith(
        expect.objectContaining({ size: 'portrait' }),
      )
    })

    it('should support 3d style', async () => {
      const handler = new ImageHandler()
      const context = createEmptyExecutionContext('emma-123')
      context.env = { GEMINI_API_KEY: 'test-key' }
      const mockProvider = createMockProvider({
        base64: 'aW1hZ2VfZGF0YQ==',
        costUnits: 1,
      })
      handler.setProvider('gemini', mockProvider)

      await handler.run({ prompt: 'A 3D object', style: '3d' }, context)

      expect(mockProvider.generateImage).toHaveBeenCalledWith(
        expect.objectContaining({ style: '3d' }),
      )
    })

    it('should support photo style', async () => {
      const handler = new ImageHandler()
      const context = createEmptyExecutionContext('emma-123')
      context.env = { GEMINI_API_KEY: 'test-key' }
      const mockProvider = createMockProvider({
        base64: 'aW1hZ2VfZGF0YQ==',
        costUnits: 1,
      })
      handler.setProvider('gemini', mockProvider)

      await handler.run(
        { prompt: 'A professional headshot', style: 'photo' },
        context,
      )

      expect(mockProvider.generateImage).toHaveBeenCalledWith(
        expect.objectContaining({ style: 'photo' }),
      )
    })
  })

  describe('R-AI-22: expression resolution in prompt', () => {
    it('should pass the prompt string directly to provider', async () => {
      const handler = new ImageHandler()
      const context = createEmptyExecutionContext('emma-123')
      context.env = { GEMINI_API_KEY: 'test-key' }
      const mockProvider = createMockProvider({
        base64: 'aW1hZ2VfZGF0YQ==',
        costUnits: 1,
      })
      handler.setProvider('gemini', mockProvider)

      // Note: Expression resolution happens in the interpreter before the handler is called
      // The handler receives the already-resolved prompt
      await handler.run({ prompt: 'Logo for Massivoto brand' }, context)

      expect(mockProvider.generateImage).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: 'Logo for Massivoto brand' }),
      )
    })
  })

  describe('R-AI-23: stores generated image as base64 string', () => {
    it('should return base64 image as value', async () => {
      const handler = new ImageHandler()
      const context = createEmptyExecutionContext('emma-123')
      context.env = { GEMINI_API_KEY: 'test-key' }
      const mockProvider = createMockProvider({
        base64:
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        costUnits: 1,
      })
      handler.setProvider('gemini', mockProvider)

      const result = await handler.run({ prompt: 'A red pixel' }, context)

      expect(result.success).toBe(true)
      expect(result.value).toBe(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      )
    })
  })

  describe('R-AI-24: returns cost metadata (cost units)', () => {
    it('should return cost based on generation cost units', async () => {
      const handler = new ImageHandler()
      const context = createEmptyExecutionContext('emma-123')
      context.env = { GEMINI_API_KEY: 'test-key' }
      const mockProvider = createMockProvider({
        base64: 'aW1hZ2VfZGF0YQ==',
        costUnits: 5,
      })
      handler.setProvider('gemini', mockProvider)

      const result = await handler.run({ prompt: 'Generate an image' }, context)

      expect(result.cost).toBe(5)
    })

    it('should include cost units in message', async () => {
      const handler = new ImageHandler()
      const context = createEmptyExecutionContext('emma-123')
      context.env = { GEMINI_API_KEY: 'test-key' }
      const mockProvider = createMockProvider({
        base64: 'aW1hZ2VfZGF0YQ==',
        costUnits: 3,
      })
      handler.setProvider('gemini', mockProvider)

      const result = await handler.run({ prompt: 'Generate an image' }, context)

      expect(result.messages).toContainEqual(expect.stringContaining('3'))
    })
  })

  describe('R-AI-33: API key from environment', () => {
    it('should fail when GEMINI_API_KEY is missing', async () => {
      const handler = new ImageHandler()
      const context = createEmptyExecutionContext('emma-123')
      context.env = {} // No API key

      const result = await handler.run({ prompt: 'Generate an image' }, context)

      expect(result.success).toBe(false)
      expect(result.fatalError).toContain('GEMINI_API_KEY')
    })

    it('should fail with actionable error message for missing key', async () => {
      const handler = new ImageHandler()
      const context = createEmptyExecutionContext('emma-123')
      context.env = {}

      const result = await handler.run({ prompt: 'Generate an image' }, context)

      expect(result.fatalError).toContain('env.dist')
    })
  })

  describe('AC-05: unknown provider error', () => {
    it('should fail with clear error for unknown provider', async () => {
      const handler = new ImageHandler()
      const context = createEmptyExecutionContext('emma-123')
      context.env = { GEMINI_API_KEY: 'test-key' }

      const result = await handler.run(
        { prompt: 'Generate an image', provider: 'dall-e-3' },
        context,
      )

      expect(result.success).toBe(false)
      expect(result.fatalError).toContain('dall-e-3')
      expect(result.fatalError).toContain('gemini')
    })
  })

  describe('R-AI-43: error handling', () => {
    it('should handle provider errors gracefully', async () => {
      const handler = new ImageHandler()
      const context = createEmptyExecutionContext('emma-123')
      context.env = { GEMINI_API_KEY: 'test-key' }
      const mockProvider: AiProvider = {
        name: 'mock',
        generateText: vi.fn().mockResolvedValue({ text: '', tokensUsed: 0 }),
        generateImage: vi
          .fn()
          .mockRejectedValue(new Error('Content policy violation')),
      }
      handler.setProvider('gemini', mockProvider)

      const result = await handler.run(
        { prompt: 'Generate something' },
        context,
      )

      expect(result.success).toBe(false)
      expect(result.fatalError).toContain('Content policy violation')
    })
  })
})
