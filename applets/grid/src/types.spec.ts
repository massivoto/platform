/**
 * Types Tests for Grid Applet
 *
 * Requirements:
 * - R-GRID-11: GridItem has required id and text fields
 * - R-GRID-12: GridItem has optional resource
 * - R-GRID-13: GridItem has optional metadata
 * - R-GRID-14: gridInputSchema and gridOutputSchema
 */
import { describe, it, expect } from 'vitest'
import {
  gridItemSchema,
  gridInputSchema,
  gridOutputSchema,
  type GridItem,
  type GridInput,
  type GridOutput,
} from './types.js'

describe('GridItem Schema', () => {
  // R-GRID-11: Define GridItem type with required id: string and text: string
  describe('R-GRID-11: required fields', () => {
    it('should accept valid GridItem with id and text', () => {
      const item: GridItem = {
        id: '1',
        text: 'Tweet A',
      }

      const result = gridItemSchema.safeParse(item)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe('1')
        expect(result.data.text).toBe('Tweet A')
      }
    })

    it('should reject GridItem without id', () => {
      const item = {
        text: 'Tweet A',
      }

      const result = gridItemSchema.safeParse(item)

      expect(result.success).toBe(false)
    })

    it('should reject GridItem without text', () => {
      const item = {
        id: '1',
      }

      const result = gridItemSchema.safeParse(item)

      expect(result.success).toBe(false)
    })

    it('should reject GridItem with non-string id', () => {
      const item = {
        id: 123,
        text: 'Tweet A',
      }

      const result = gridItemSchema.safeParse(item)

      expect(result.success).toBe(false)
    })
  })

  // R-GRID-12: Add optional resource?: { url: string; type?: 'image' | 'video' | 'audio' }
  describe('R-GRID-12: optional resource field', () => {
    it('should accept GridItem with resource containing url only', () => {
      const item: GridItem = {
        id: '1',
        text: 'Tweet with image',
        resource: {
          url: 'https://example.com/image.jpg',
        },
      }

      const result = gridItemSchema.safeParse(item)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.resource?.url).toBe('https://example.com/image.jpg')
      }
    })

    it('should accept GridItem with resource containing url and type', () => {
      const item: GridItem = {
        id: '1',
        text: 'Tweet with video',
        resource: {
          url: 'https://example.com/video.mp4',
          type: 'video',
        },
      }

      const result = gridItemSchema.safeParse(item)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.resource?.type).toBe('video')
      }
    })

    it('should accept resource type image', () => {
      const item: GridItem = {
        id: '1',
        text: 'Image item',
        resource: { url: 'https://example.com/img.png', type: 'image' },
      }

      const result = gridItemSchema.safeParse(item)

      expect(result.success).toBe(true)
    })

    it('should accept resource type audio', () => {
      const item: GridItem = {
        id: '1',
        text: 'Audio item',
        resource: { url: 'https://example.com/sound.mp3', type: 'audio' },
      }

      const result = gridItemSchema.safeParse(item)

      expect(result.success).toBe(true)
    })

    it('should reject invalid resource type', () => {
      const item = {
        id: '1',
        text: 'Item',
        resource: { url: 'https://example.com/file.pdf', type: 'pdf' },
      }

      const result = gridItemSchema.safeParse(item)

      expect(result.success).toBe(false)
    })

    it('should reject resource without url', () => {
      const item = {
        id: '1',
        text: 'Item',
        resource: { type: 'image' },
      }

      const result = gridItemSchema.safeParse(item)

      expect(result.success).toBe(false)
    })
  })

  // R-GRID-13: Add optional metadata?: Record<string, string>
  describe('R-GRID-13: optional metadata field', () => {
    it('should accept GridItem with metadata', () => {
      const item: GridItem = {
        id: '1',
        text: 'Tweet A',
        metadata: {
          author: 'AI',
          tone: 'casual',
        },
      }

      const result = gridItemSchema.safeParse(item)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.metadata?.author).toBe('AI')
        expect(result.data.metadata?.tone).toBe('casual')
      }
    })

    it('should accept GridItem with empty metadata', () => {
      const item: GridItem = {
        id: '1',
        text: 'Tweet A',
        metadata: {},
      }

      const result = gridItemSchema.safeParse(item)

      expect(result.success).toBe(true)
    })

    it('should accept GridItem without metadata', () => {
      const item: GridItem = {
        id: '1',
        text: 'Tweet A',
      }

      const result = gridItemSchema.safeParse(item)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.metadata).toBeUndefined()
      }
    })
  })
})

describe('Grid Input/Output Schemas', () => {
  // R-GRID-14: Define gridInputSchema (items: GridItem[], title?: string) and gridOutputSchema
  describe('R-GRID-14: input schema', () => {
    it('should accept valid input with items array', () => {
      const input: GridInput = {
        items: [
          { id: '1', text: 'Tweet A' },
          { id: '2', text: 'Tweet B' },
        ],
      }

      const result = gridInputSchema.safeParse(input)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.items).toHaveLength(2)
      }
    })

    it('should accept input with optional title', () => {
      const input: GridInput = {
        items: [{ id: '1', text: 'Tweet A' }],
        title: 'Select tweets to publish',
      }

      const result = gridInputSchema.safeParse(input)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('Select tweets to publish')
      }
    })

    it('should reject input without items', () => {
      const input = {
        title: 'Select items',
      }

      const result = gridInputSchema.safeParse(input)

      expect(result.success).toBe(false)
    })

    it('should reject input with empty items array', () => {
      const input = {
        items: [],
      }

      const result = gridInputSchema.safeParse(input)

      expect(result.success).toBe(false)
    })
  })

  describe('R-GRID-14: output schema', () => {
    it('should accept output with selected items array', () => {
      const output: GridOutput = {
        selected: [
          { id: '1', text: 'Tweet A' },
          { id: '3', text: 'Tweet C' },
        ],
      }

      const result = gridOutputSchema.safeParse(output)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.selected).toHaveLength(2)
      }
    })

    it('should accept output with empty selected array (no items selected)', () => {
      const output: GridOutput = {
        selected: [],
      }

      const result = gridOutputSchema.safeParse(output)

      expect(result.success).toBe(true)
    })

    it('should reject output without selected field', () => {
      const output = {}

      const result = gridOutputSchema.safeParse(output)

      expect(result.success).toBe(false)
    })
  })
})
