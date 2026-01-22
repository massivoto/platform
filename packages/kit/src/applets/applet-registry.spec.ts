/**
 * Tests for AppletRegistry
 *
 * R-APP-21: Wraps BaseComposableRegistry<AppletDefinition>
 * R-APP-22: addBundle() to register applet bundles
 * R-APP-23: reload() with conflict detection
 * R-APP-24: get() returns RegistryEntry<AppletDefinition> | undefined
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { z } from 'zod'
import type { RegistryBundle } from '../registry/types.js'
import {
  RegistryConflictError,
  RegistryNotLoadedError,
} from '../registry/errors.js'
import { AppletRegistry } from './applet-registry.js'
import type { AppletDefinition } from './types.js'

/**
 * Helper to create a simple applet definition for testing
 */
function createAppletDefinition(
  id: string,
  options?: { packageName?: string; timeoutMs?: number },
): AppletDefinition {
  return {
    id,
    type: 'applet',
    inputSchema: z.object({ message: z.string() }),
    outputSchema: z.object({ result: z.boolean() }),
    packageName: options?.packageName,
    timeoutMs: options?.timeoutMs,
    init: async () => {},
    dispose: async () => {},
  }
}

/**
 * Test bundle for applet definitions
 */
class TestAppletBundle implements RegistryBundle<AppletDefinition> {
  constructor(
    public readonly id: string,
    private readonly applets: Map<string, AppletDefinition>,
  ) {}

  async load(): Promise<Map<string, AppletDefinition>> {
    return this.applets
  }
}

describe('AppletRegistry', () => {
  let registry: AppletRegistry

  beforeEach(() => {
    registry = new AppletRegistry()
  })

  /**
   * R-APP-21: Wraps BaseComposableRegistry
   */
  describe('constructor', () => {
    it('should create an empty registry', () => {
      expect(registry).toBeInstanceOf(AppletRegistry)
    })
  })

  /**
   * R-APP-22: addBundle() to register applet bundles
   */
  describe('addBundle', () => {
    it('should add a bundle to the registry', () => {
      const bundle = new TestAppletBundle('test', new Map())
      registry.addBundle(bundle)

      // Verify bundle was added (via getBundles)
      expect(registry.getBundles()).toHaveLength(1)
      expect(registry.getBundles()[0].id).toBe('test')
    })

    it('should allow adding multiple bundles', () => {
      const bundle1 = new TestAppletBundle('core', new Map())
      const bundle2 = new TestAppletBundle('custom', new Map())

      registry.addBundle(bundle1)
      registry.addBundle(bundle2)

      expect(registry.getBundles()).toHaveLength(2)
    })
  })

  /**
   * R-APP-23: reload() with conflict detection
   */
  describe('reload', () => {
    it('should load applets from bundles', async () => {
      const applets = new Map<string, AppletDefinition>()
      applets.set('confirm', createAppletDefinition('confirm'))
      applets.set('grid', createAppletDefinition('grid'))

      registry.addBundle(new TestAppletBundle('core', applets))
      await registry.reload()

      expect(await registry.keys()).toEqual(['confirm', 'grid'])
    })

    it('should throw RegistryNotLoadedError if accessed before reload', async () => {
      await expect(registry.get('confirm')).rejects.toThrow(
        RegistryNotLoadedError,
      )
      await expect(registry.has('confirm')).rejects.toThrow(
        RegistryNotLoadedError,
      )
      await expect(registry.keys()).rejects.toThrow(RegistryNotLoadedError)
    })

    it('should throw RegistryConflictError on duplicate keys', async () => {
      const applets1 = new Map<string, AppletDefinition>()
      applets1.set('confirm', createAppletDefinition('confirm'))

      const applets2 = new Map<string, AppletDefinition>()
      applets2.set('confirm', createAppletDefinition('confirm'))

      registry.addBundle(new TestAppletBundle('core', applets1))
      registry.addBundle(new TestAppletBundle('custom', applets2))

      await expect(registry.reload()).rejects.toThrow(RegistryConflictError)
    })

    it('should call init on loaded applets', async () => {
      let initCalled = false
      const applet: AppletDefinition = {
        ...createAppletDefinition('test'),
        init: async () => {
          initCalled = true
        },
      }

      const applets = new Map<string, AppletDefinition>()
      applets.set('test', applet)
      registry.addBundle(new TestAppletBundle('core', applets))

      await registry.reload()

      expect(initCalled).toBe(true)
    })

    it('should call dispose on existing applets before reload', async () => {
      let disposeCalled = false
      const applet: AppletDefinition = {
        ...createAppletDefinition('test'),
        dispose: async () => {
          disposeCalled = true
        },
      }

      const applets = new Map<string, AppletDefinition>()
      applets.set('test', applet)
      registry.addBundle(new TestAppletBundle('core', applets))

      await registry.reload()
      expect(disposeCalled).toBe(false) // Not called on first load

      // Reload again
      await registry.reload()
      expect(disposeCalled).toBe(true)
    })
  })

  /**
   * R-APP-24: get() returns RegistryEntry<AppletDefinition>
   */
  describe('get', () => {
    it('should return entry with value and bundleId', async () => {
      const confirmApplet = createAppletDefinition('confirm')
      const applets = new Map<string, AppletDefinition>()
      applets.set('confirm', confirmApplet)

      registry.addBundle(new TestAppletBundle('core', applets))
      await registry.reload()

      const entry = await registry.get('confirm')

      expect(entry).toBeDefined()
      expect(entry!.key).toBe('confirm')
      expect(entry!.value).toBe(confirmApplet)
      expect(entry!.bundleId).toBe('core')
    })

    it('should return undefined for unknown applet', async () => {
      registry.addBundle(new TestAppletBundle('core', new Map()))
      await registry.reload()

      const entry = await registry.get('unknown')

      expect(entry).toBeUndefined()
    })

    /**
     * AC-APP-02: Carlos gets confirm applet with correct schemas
     */
    it('AC-APP-02: should return confirm applet definition with correct schemas', async () => {
      const confirmApplet: AppletDefinition = {
        id: 'confirm',
        type: 'applet',
        inputSchema: z.object({
          message: z.string(),
          title: z.string().optional(),
        }),
        outputSchema: z.object({ approved: z.boolean() }),
        init: async () => {},
        dispose: async () => {},
      }

      const applets = new Map<string, AppletDefinition>()
      applets.set('confirm', confirmApplet)

      registry.addBundle(new TestAppletBundle('core', applets))
      await registry.reload()

      const entry = await registry.get('confirm')

      expect(entry).toBeDefined()
      expect(
        entry!.value.inputSchema.safeParse({ message: 'Approve?' }).success,
      ).toBe(true)
      expect(
        entry!.value.outputSchema.safeParse({ approved: true }).success,
      ).toBe(true)
    })
  })

  describe('has', () => {
    it('should return true for existing applet', async () => {
      const applets = new Map<string, AppletDefinition>()
      applets.set('confirm', createAppletDefinition('confirm'))

      registry.addBundle(new TestAppletBundle('core', applets))
      await registry.reload()

      expect(await registry.has('confirm')).toBe(true)
    })

    it('should return false for non-existing applet', async () => {
      registry.addBundle(new TestAppletBundle('core', new Map()))
      await registry.reload()

      expect(await registry.has('unknown')).toBe(false)
    })
  })

  describe('keys', () => {
    /**
     * AC-APP-03: List all applets with keys()
     */
    it('AC-APP-03: should return all registered applet keys', async () => {
      const applets = new Map<string, AppletDefinition>()
      applets.set('confirm', createAppletDefinition('confirm'))
      applets.set('grid', createAppletDefinition('grid'))
      applets.set('generation', createAppletDefinition('generation'))

      registry.addBundle(new TestAppletBundle('core', applets))
      await registry.reload()

      const keys = await registry.keys()

      expect(keys).toContain('confirm')
      expect(keys).toContain('grid')
      expect(keys).toContain('generation')
      expect(keys).toHaveLength(3)
    })
  })

  describe('entries', () => {
    it('should return all entries as a Map', async () => {
      const applets = new Map<string, AppletDefinition>()
      applets.set('confirm', createAppletDefinition('confirm'))
      applets.set('grid', createAppletDefinition('grid'))

      registry.addBundle(new TestAppletBundle('core', applets))
      await registry.reload()

      const entries = await registry.entries()

      expect(entries.size).toBe(2)
      expect(entries.get('confirm')?.bundleId).toBe('core')
      expect(entries.get('grid')?.bundleId).toBe('core')
    })
  })
})
