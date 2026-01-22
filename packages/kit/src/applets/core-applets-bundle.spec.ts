/**
 * Tests for CoreAppletsBundle
 *
 * R-APP-41: Implements RegistryBundle<AppletDefinition>
 * R-APP-42: Define confirm applet
 * R-APP-43: Define grid applet
 * R-APP-44: Define generation applet
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CoreAppletsBundle } from './core-applets-bundle.js'
import type { AppletDefinition } from './types.js'

describe('CoreAppletsBundle', () => {
  let bundle: CoreAppletsBundle
  let applets: Map<string, AppletDefinition>

  beforeEach(async () => {
    bundle = new CoreAppletsBundle()
    applets = await bundle.load()
  })

  /**
   * R-APP-41: Implements RegistryBundle<AppletDefinition>
   */
  describe('bundle interface', () => {
    it('should have id "core"', () => {
      expect(bundle.id).toBe('core')
    })

    it('should load 3 applet definitions', async () => {
      expect(applets.size).toBe(3)
    })

    it('should include confirm, grid, and generation applets', () => {
      expect(applets.has('confirm')).toBe(true)
      expect(applets.has('grid')).toBe(true)
      expect(applets.has('generation')).toBe(true)
    })
  })

  /**
   * R-APP-42: confirm applet
   */
  describe('confirm applet', () => {
    it('should have type "applet"', () => {
      const confirm = applets.get('confirm')!
      expect(confirm.type).toBe('applet')
    })

    it('should have id "confirm"', () => {
      const confirm = applets.get('confirm')!
      expect(confirm.id).toBe('confirm')
    })

    it('should validate input with message (required), title (optional), and resourceUrl (optional)', () => {
      const confirm = applets.get('confirm')!

      // Valid: message only
      expect(
        confirm.inputSchema.safeParse({ message: 'Approve this post?' })
          .success,
      ).toBe(true)

      // Valid: message and title
      expect(
        confirm.inputSchema.safeParse({
          message: 'Approve this post?',
          title: 'Confirm Action',
        }).success,
      ).toBe(true)

      // Valid: message and resourceUrl
      expect(
        confirm.inputSchema.safeParse({
          message: 'Review this image',
          resourceUrl: 'https://example.com/image.jpg',
        }).success,
      ).toBe(true)

      // Valid: all fields
      expect(
        confirm.inputSchema.safeParse({
          message: 'Review this content',
          title: 'Content Review',
          resourceUrl: 'https://example.com/video.mp4',
        }).success,
      ).toBe(true)

      // Invalid: missing message
      expect(confirm.inputSchema.safeParse({}).success).toBe(false)
      expect(
        confirm.inputSchema.safeParse({ title: 'Title only' }).success,
      ).toBe(false)

      // Invalid: resourceUrl not a valid URL
      expect(
        confirm.inputSchema.safeParse({
          message: 'Test',
          resourceUrl: 'not-a-url',
        }).success,
      ).toBe(false)
    })

    it('should validate output with approved boolean', () => {
      const confirm = applets.get('confirm')!

      expect(confirm.outputSchema.safeParse({ approved: true }).success).toBe(
        true,
      )
      expect(confirm.outputSchema.safeParse({ approved: false }).success).toBe(
        true,
      )

      // Invalid: missing approved
      expect(confirm.outputSchema.safeParse({}).success).toBe(false)
      // Invalid: wrong type
      expect(confirm.outputSchema.safeParse({ approved: 'yes' }).success).toBe(
        false,
      )
    })

    /**
     * AC-APP-04: Emma validates input against confirm applet schema
     */
    it('AC-APP-04: should accept { message: "Approve this post?" }', () => {
      const confirm = applets.get('confirm')!
      const result = confirm.inputSchema.safeParse({
        message: 'Approve this post?',
      })
      expect(result.success).toBe(true)
    })
  })

  /**
   * R-APP-43: grid applet
   */
  describe('grid applet', () => {
    it('should have type "applet" and id "grid"', () => {
      const grid = applets.get('grid')!
      expect(grid.type).toBe('applet')
      expect(grid.id).toBe('grid')
    })

    it('should validate input with items (required) and labelKey (optional)', () => {
      const grid = applets.get('grid')!

      // Valid: items only
      expect(
        grid.inputSchema.safeParse({
          items: [{ id: '1' }, { id: '2' }],
        }).success,
      ).toBe(true)

      // Valid: items and labelKey
      expect(
        grid.inputSchema.safeParse({
          items: [{ id: '1', text: 'Post A' }],
          labelKey: 'text',
        }).success,
      ).toBe(true)

      // Invalid: missing items
      expect(grid.inputSchema.safeParse({}).success).toBe(false)

      // Invalid: items not an array
      expect(grid.inputSchema.safeParse({ items: 'not-array' }).success).toBe(
        false,
      )
    })

    it('should validate output with selected string array', () => {
      const grid = applets.get('grid')!

      expect(
        grid.outputSchema.safeParse({ selected: ['1', '2'] }).success,
      ).toBe(true)
      expect(grid.outputSchema.safeParse({ selected: [] }).success).toBe(true)

      // Invalid: missing selected
      expect(grid.outputSchema.safeParse({}).success).toBe(false)
      // Invalid: wrong type in array
      expect(grid.outputSchema.safeParse({ selected: [1, 2] }).success).toBe(
        false,
      )
    })

    /**
     * AC-APP-05: Carlos validates input against grid applet schema
     */
    it('AC-APP-05: should accept items with id and text', () => {
      const grid = applets.get('grid')!
      const result = grid.inputSchema.safeParse({
        items: [
          { id: '1', text: 'Post A' },
          { id: '2', text: 'Post B' },
        ],
      })
      expect(result.success).toBe(true)
    })
  })

  /**
   * R-APP-44: generation applet
   */
  describe('generation applet', () => {
    it('should have type "applet" and id "generation"', () => {
      const generation = applets.get('generation')!
      expect(generation.type).toBe('applet')
      expect(generation.id).toBe('generation')
    })

    it('should validate input with items (required), prompt (optional), model (optional)', () => {
      const generation = applets.get('generation')!

      // Valid: items only
      expect(
        generation.inputSchema.safeParse({
          items: [{ id: '1', content: 'Draft post' }],
        }).success,
      ).toBe(true)

      // Valid: with prompt
      expect(
        generation.inputSchema.safeParse({
          items: [{ id: '1' }],
          prompt: 'Generate a caption',
        }).success,
      ).toBe(true)

      // Valid: with model
      expect(
        generation.inputSchema.safeParse({
          items: [{ id: '1' }],
          model: 'gemini-flash',
        }).success,
      ).toBe(true)

      // Valid: all options
      expect(
        generation.inputSchema.safeParse({
          items: [{ id: '1' }],
          prompt: 'Generate a caption',
          model: 'claude-sonnet',
        }).success,
      ).toBe(true)

      // Invalid: missing items
      expect(generation.inputSchema.safeParse({}).success).toBe(false)
    })

    it('should validate output with results array of { id, text }', () => {
      const generation = applets.get('generation')!

      expect(
        generation.outputSchema.safeParse({
          results: [
            { id: '1', text: 'Generated caption' },
            { id: '2', text: 'Another caption' },
          ],
        }).success,
      ).toBe(true)

      expect(generation.outputSchema.safeParse({ results: [] }).success).toBe(
        true,
      )

      // Invalid: missing results
      expect(generation.outputSchema.safeParse({}).success).toBe(false)

      // Invalid: wrong structure
      expect(
        generation.outputSchema.safeParse({
          results: [{ id: '1' }], // missing text
        }).success,
      ).toBe(false)
    })
  })

  describe('applet lifecycle', () => {
    it('should have init and dispose methods', async () => {
      for (const [, applet] of applets) {
        expect(typeof applet.init).toBe('function')
        expect(typeof applet.dispose).toBe('function')

        // Should not throw
        await expect(applet.init()).resolves.toBeUndefined()
        await expect(applet.dispose()).resolves.toBeUndefined()
      }
    })
  })
})
