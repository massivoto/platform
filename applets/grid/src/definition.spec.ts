/**
 * Definition Tests for Grid Applet
 *
 * Requirements:
 * - R-GRID-03: Export definition from package entry point
 */
import { describe, it, expect } from 'vitest'
import { definition, gridInputSchema, gridOutputSchema } from './definition.js'

describe('Grid Applet Definition', () => {
  // R-GRID-03: Export definition from package entry point
  describe('R-GRID-03: AppletDefinition interface', () => {
    it('should have id property set to "grid"', () => {
      expect(definition.id).toBe('grid')
    })

    it('should have type property set to "applet"', () => {
      expect(definition.type).toBe('applet')
    })

    it('should have inputSchema property', () => {
      expect(definition.inputSchema).toBe(gridInputSchema)
    })

    it('should have outputSchema property', () => {
      expect(definition.outputSchema).toBe(gridOutputSchema)
    })

    it('should have packageName property', () => {
      expect(definition.packageName).toBe('@massivoto/applet-grid')
    })

    it('should have timeoutMs property', () => {
      expect(definition.timeoutMs).toBe(5 * 60 * 1000) // 5 minutes
    })

    it('should have init method', async () => {
      await expect(definition.init()).resolves.toBeUndefined()
    })

    it('should have dispose method', async () => {
      await expect(definition.dispose()).resolves.toBeUndefined()
    })
  })
})
