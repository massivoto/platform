/**
 * CoreHandlersBundle Tests
 *
 * Theme: Social Media Automation
 *
 * Requirements tested:
 * - R-CMD-41 to R-CMD-44: Core Handlers Bundle
 * - AC-CMD-01, AC-CMD-02: Core handler resolution
 */
import { describe, it, expect } from 'vitest'
import { CoreHandlersBundle } from './core-handlers-bundle.js'
import { CommandHandler } from './types.js'
import { createEmptyExecutionContext } from '../context/core-context.js'

describe('CoreHandlersBundle', () => {
  describe('R-CMD-41: Implements RegistryBundle<CommandHandler>', () => {
    it('should implement load() returning Map<string, CommandHandler>', async () => {
      const bundle = new CoreHandlersBundle()

      const handlers = await bundle.load()

      expect(handlers).toBeInstanceOf(Map)
      // Should have at least the core handlers
      expect(handlers.size).toBeGreaterThan(0)
    })
  })

  describe('R-CMD-42: id is "core"', () => {
    it('should have id = "core"', () => {
      const bundle = new CoreHandlersBundle()

      expect(bundle.id).toBe('core')
    })
  })

  describe('R-CMD-43: load() returns Map of built-in handlers', () => {
    it('should return handlers with proper CommandHandler interface', async () => {
      const bundle = new CoreHandlersBundle()
      const handlers = await bundle.load()

      for (const [key, handler] of handlers) {
        // Verify RegistryItem interface
        expect(handler.id).toBeDefined()
        expect(handler.type).toBe('command')
        expect(typeof handler.init).toBe('function')
        expect(typeof handler.dispose).toBe('function')

        // Verify CommandHandler interface
        expect(typeof handler.run).toBe('function')

        // Key should match handler id
        expect(key).toBe(handler.id)
      }
    })
  })

  describe('R-CMD-44: Migrated handlers available', () => {
    it('should include @utils/log handler', async () => {
      const bundle = new CoreHandlersBundle()
      const handlers = await bundle.load()

      expect(handlers.has('@utils/log')).toBe(true)

      const logHandler = handlers.get('@utils/log')
      expect(logHandler?.id).toBe('@utils/log')
      expect(logHandler?.type).toBe('command')
    })

    it('should include @utils/set handler', async () => {
      const bundle = new CoreHandlersBundle()
      const handlers = await bundle.load()

      expect(handlers.has('@utils/set')).toBe(true)

      const setHandler = handlers.get('@utils/set')
      expect(setHandler?.id).toBe('@utils/set')
      expect(setHandler?.type).toBe('command')
    })
  })

  describe('AC-CMD-01: @utils/log is resolvable after load', () => {
    it('should load @utils/log handler', async () => {
      const bundle = new CoreHandlersBundle()
      const handlers = await bundle.load()

      const logHandler = handlers.get('@utils/log')

      expect(logHandler).toBeDefined()
      expect(logHandler?.id).toBe('@utils/log')
    })
  })

  describe('AC-CMD-02: @utils/set resolves to SetHandler', () => {
    it('should load SetHandler for @utils/set', async () => {
      const bundle = new CoreHandlersBundle()
      const handlers = await bundle.load()

      const setHandler = handlers.get('@utils/set') as CommandHandler<any>

      expect(setHandler).toBeDefined()
      expect(setHandler.id).toBe('@utils/set')

      // Verify it works by running it
      const context = createEmptyExecutionContext('test-user')
      const result = await setHandler.run({ input: 'test-value' }, context)

      expect(result.success).toBe(true)
      expect(result.value).toBe('test-value')
    })
  })

  describe('Handler lifecycle methods', () => {
    it('should have working init() on handlers', async () => {
      const bundle = new CoreHandlersBundle()
      const handlers = await bundle.load()

      const logHandler = handlers.get('@utils/log')!

      // Default init should not throw
      await expect(logHandler.init()).resolves.toBeUndefined()
    })

    it('should have working dispose() on handlers', async () => {
      const bundle = new CoreHandlersBundle()
      const handlers = await bundle.load()

      const setHandler = handlers.get('@utils/set')!

      // Default dispose should not throw
      await expect(setHandler.dispose()).resolves.toBeUndefined()
    })
  })
})
