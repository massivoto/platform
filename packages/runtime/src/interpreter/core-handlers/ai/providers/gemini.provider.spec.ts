import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GeminiProvider } from './gemini.provider.js'

/**
 * Test file: gemini.provider.spec.ts
 * Theme: Social Media Automation (Emma, Carlos, content generation)
 *
 * Tests for GeminiProvider (R-AI-31 to R-AI-33)
 *
 * Note: These tests mock the global fetch to avoid actual API calls.
 */

describe('GeminiProvider', () => {
  let originalFetch: typeof global.fetch

  beforeEach(() => {
    originalFetch = global.fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  describe('R-AI-31: text generation via Gemini API', () => {
    it('should have name property set to gemini', () => {
      const provider = new GeminiProvider('test-api-key')

      expect(provider.name).toBe('gemini')
    })

    it('should call Gemini API with correct endpoint for text generation', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: 'Generated tagline for Emma' }],
                },
              },
            ],
            usageMetadata: {
              totalTokenCount: 15,
            },
          }),
      })
      global.fetch = mockFetch

      const provider = new GeminiProvider('test-api-key')
      await provider.generateText({ prompt: 'Write a tagline' })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('generativelanguage.googleapis.com'),
        expect.any(Object),
      )
    })

    it('should include API key in request', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: 'Generated text' }],
                },
              },
            ],
            usageMetadata: {
              totalTokenCount: 10,
            },
          }),
      })
      global.fetch = mockFetch

      const provider = new GeminiProvider('my-secret-key')
      await provider.generateText({ prompt: 'Hello' })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('key=my-secret-key'),
        expect.any(Object),
      )
    })

    it('should return generated text and token count', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: 'Emma is a social media expert' }],
                },
              },
            ],
            usageMetadata: {
              totalTokenCount: 25,
            },
          }),
      })
      global.fetch = mockFetch

      const provider = new GeminiProvider('test-key')
      const result = await provider.generateText({ prompt: 'Tell me about Emma' })

      expect(result.text).toBe('Emma is a social media expert')
      expect(result.tokensUsed).toBe(25)
    })

    it('should pass temperature to API', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: 'Creative text' }],
                },
              },
            ],
            usageMetadata: { totalTokenCount: 5 },
          }),
      })
      global.fetch = mockFetch

      const provider = new GeminiProvider('test-key')
      await provider.generateText({ prompt: 'Be creative', temperature: 0.9 })

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.generationConfig.temperature).toBe(0.9)
    })

    it('should pass maxTokens to API as maxOutputTokens', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: 'Short text' }],
                },
              },
            ],
            usageMetadata: { totalTokenCount: 10 },
          }),
      })
      global.fetch = mockFetch

      const provider = new GeminiProvider('test-key')
      await provider.generateText({ prompt: 'Be brief', maxTokens: 50 })

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.generationConfig.maxOutputTokens).toBe(50)
    })

    it('should pass system prompt as system instruction', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: 'Professional response' }],
                },
              },
            ],
            usageMetadata: { totalTokenCount: 8 },
          }),
      })
      global.fetch = mockFetch

      const provider = new GeminiProvider('test-key')
      await provider.generateText({
        prompt: 'Write content',
        system: 'You are a marketing expert',
      })

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.systemInstruction.parts[0].text).toBe(
        'You are a marketing expert',
      )
    })

    it('should use specified model', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: 'Response' }],
                },
              },
            ],
            usageMetadata: { totalTokenCount: 5 },
          }),
      })
      global.fetch = mockFetch

      const provider = new GeminiProvider('test-key')
      await provider.generateText({ prompt: 'Hello', model: 'gemini-1.5-flash' })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('gemini-1.5-flash'),
        expect.any(Object),
      )
    })

    it('should use default model when not specified', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: 'Response' }],
                },
              },
            ],
            usageMetadata: { totalTokenCount: 5 },
          }),
      })
      global.fetch = mockFetch

      const provider = new GeminiProvider('test-key')
      await provider.generateText({ prompt: 'Hello' })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('gemini-1.5-pro'),
        expect.any(Object),
      )
    })

    it('should throw error on API failure', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: () => Promise.resolve('Rate limit exceeded'),
      })
      global.fetch = mockFetch

      const provider = new GeminiProvider('test-key')

      await expect(
        provider.generateText({ prompt: 'Hello' }),
      ).rejects.toThrow('Rate limit exceeded')
    })
  })

  describe('R-AI-32: image generation via Imagen API', () => {
    it('should call Imagen API for image generation', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            predictions: [
              {
                bytesBase64Encoded: 'iVBORw0KGgoAAAANSUhEUg==',
              },
            ],
          }),
      })
      global.fetch = mockFetch

      const provider = new GeminiProvider('test-key')
      await provider.generateImage({ prompt: 'A fox in a forest' })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('generativelanguage.googleapis.com'),
        expect.any(Object),
      )
    })

    it('should return base64 image data', async () => {
      const expectedBase64 =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            predictions: [
              {
                bytesBase64Encoded: expectedBase64,
              },
            ],
          }),
      })
      global.fetch = mockFetch

      const provider = new GeminiProvider('test-key')
      const result = await provider.generateImage({ prompt: 'A red pixel' })

      expect(result.base64).toBe(expectedBase64)
    })

    it('should return cost units (1 per image)', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            predictions: [
              {
                bytesBase64Encoded: 'aW1hZ2U=',
              },
            ],
          }),
      })
      global.fetch = mockFetch

      const provider = new GeminiProvider('test-key')
      const result = await provider.generateImage({ prompt: 'An image' })

      expect(result.costUnits).toBe(1)
    })

    it('should map size to Imagen dimensions', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            predictions: [{ bytesBase64Encoded: 'aW1hZ2U=' }],
          }),
      })
      global.fetch = mockFetch

      const provider = new GeminiProvider('test-key')
      await provider.generateImage({ prompt: 'Banner', size: 'landscape' })

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      // Landscape should be wider than tall
      expect(callBody.parameters.aspectRatio).toBe('16:9')
    })

    it('should map square size', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            predictions: [{ bytesBase64Encoded: 'aW1hZ2U=' }],
          }),
      })
      global.fetch = mockFetch

      const provider = new GeminiProvider('test-key')
      await provider.generateImage({ prompt: 'Logo', size: 'square' })

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.parameters.aspectRatio).toBe('1:1')
    })

    it('should map portrait size', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            predictions: [{ bytesBase64Encoded: 'aW1hZ2U=' }],
          }),
      })
      global.fetch = mockFetch

      const provider = new GeminiProvider('test-key')
      await provider.generateImage({ prompt: 'Portrait', size: 'portrait' })

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.parameters.aspectRatio).toBe('9:16')
    })

    it('should throw error on API failure', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: () => Promise.resolve('Content policy violation'),
      })
      global.fetch = mockFetch

      const provider = new GeminiProvider('test-key')

      await expect(
        provider.generateImage({ prompt: 'Inappropriate content' }),
      ).rejects.toThrow('Content policy violation')
    })
  })
})
