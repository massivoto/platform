/**
 * PipeRegistry Tests
 *
 * Requirements tested:
 * - R-PIPE-21: PipeRegistry class wrapping BaseComposableRegistry<PipeFunction>
 * - R-PIPE-22: PipeRegistry.addBundle(bundle) registers a pipe bundle
 * - R-PIPE-23: PipeRegistry.reload() loads all bundles with conflict detection
 * - R-PIPE-24: PipeRegistry.get(pipeId) returns RegistryEntry<PipeFunction> | undefined
 * - AC-PIPE-01: Given CorePipesBundle, when reload() is called, then 9 pipes are registered
 * - AC-PIPE-02: Given registry with 'filter' pipe, when get('filter') is called, then returns RegistryEntry with bundleId 'core'
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { RegistryConflictError, RegistryNotLoadedError } from '@massivoto/kit'
import type { RegistryBundle } from '@massivoto/kit'
import { PipeRegistry } from './pipe-registry.js'
import { CorePipesBundle } from './core-pipes-bundle.js'
import type { PipeFunction } from './types.js'
import { BasePipeFunction } from './types.js'

describe('PipeRegistry', () => {
  describe('R-PIPE-21: PipeRegistry wraps BaseComposableRegistry', () => {
    it('should be instantiable', () => {
      const registry = new PipeRegistry()

      expect(registry).toBeDefined()
    })

    it('should have addBundle method', () => {
      const registry = new PipeRegistry()

      expect(typeof registry.addBundle).toBe('function')
    })

    it('should have reload method', () => {
      const registry = new PipeRegistry()

      expect(typeof registry.reload).toBe('function')
    })

    it('should have get method', () => {
      const registry = new PipeRegistry()

      expect(typeof registry.get).toBe('function')
    })
  })

  describe('R-PIPE-22: addBundle registers a pipe bundle', () => {
    it('should accept a bundle', () => {
      const registry = new PipeRegistry()
      const bundle = new CorePipesBundle()

      // Should not throw
      registry.addBundle(bundle)
    })

    it('should accept multiple bundles', () => {
      const registry = new PipeRegistry()

      // Create a custom bundle
      class CustomBundle implements RegistryBundle<PipeFunction> {
        readonly id = 'custom'
        async load(): Promise<Map<string, PipeFunction>> {
          return new Map()
        }
      }

      registry.addBundle(new CorePipesBundle())
      registry.addBundle(new CustomBundle())

      // getBundles should return both
      expect(registry.getBundles()).toHaveLength(2)
    })

    it('should expose getBundles()', () => {
      const registry = new PipeRegistry()
      const bundle = new CorePipesBundle()

      registry.addBundle(bundle)

      const bundles = registry.getBundles()
      expect(bundles).toHaveLength(1)
      expect(bundles[0].id).toBe('core')
    })
  })

  describe('R-PIPE-23: reload() loads all bundles with conflict detection', () => {
    it('should load bundles without error', async () => {
      const registry = new PipeRegistry()
      registry.addBundle(new CorePipesBundle())

      await expect(registry.reload()).resolves.toBeUndefined()
    })

    it('AC-PIPE-01: should register 9 pipes from CorePipesBundle', async () => {
      const registry = new PipeRegistry()
      registry.addBundle(new CorePipesBundle())

      await registry.reload()

      const keys = await registry.keys()
      expect(keys).toHaveLength(9)
    })

    it('should throw RegistryNotLoadedError if get() called before reload()', async () => {
      const registry = new PipeRegistry()
      registry.addBundle(new CorePipesBundle())

      // Not calling reload() - should throw
      await expect(registry.get('filter')).rejects.toThrow(
        RegistryNotLoadedError,
      )
    })

    it('should detect conflicts between bundles', async () => {
      const registry = new PipeRegistry()

      // Create two bundles with the same pipe id
      class BundleA implements RegistryBundle<PipeFunction> {
        readonly id = 'bundle-a'
        async load(): Promise<Map<string, PipeFunction>> {
          const pipes = new Map<string, PipeFunction>()
          pipes.set(
            'duplicate',
            new (class extends BasePipeFunction {
              readonly id = 'duplicate'
              async execute(input: any): Promise<any> {
                return input
              }
            })(),
          )
          return pipes
        }
      }

      class BundleB implements RegistryBundle<PipeFunction> {
        readonly id = 'bundle-b'
        async load(): Promise<Map<string, PipeFunction>> {
          const pipes = new Map<string, PipeFunction>()
          pipes.set(
            'duplicate',
            new (class extends BasePipeFunction {
              readonly id = 'duplicate'
              async execute(input: any): Promise<any> {
                return input
              }
            })(),
          )
          return pipes
        }
      }

      registry.addBundle(new BundleA())
      registry.addBundle(new BundleB())

      await expect(registry.reload()).rejects.toThrow(RegistryConflictError)
    })

    it('should call init() on all pipes after loading', async () => {
      let initCalled = false

      class InitTrackerBundle implements RegistryBundle<PipeFunction> {
        readonly id = 'init-tracker'
        async load(): Promise<Map<string, PipeFunction>> {
          const pipes = new Map<string, PipeFunction>()
          pipes.set(
            'tracker',
            new (class extends BasePipeFunction {
              readonly id = 'tracker'
              async init(): Promise<void> {
                initCalled = true
              }
              async execute(input: any): Promise<any> {
                return input
              }
            })(),
          )
          return pipes
        }
      }

      const registry = new PipeRegistry()
      registry.addBundle(new InitTrackerBundle())

      await registry.reload()

      expect(initCalled).toBe(true)
    })
  })

  describe('R-PIPE-24: get(pipeId) returns RegistryEntry or undefined', () => {
    let registry: PipeRegistry

    beforeEach(async () => {
      registry = new PipeRegistry()
      registry.addBundle(new CorePipesBundle())
      await registry.reload()
    })

    it('AC-PIPE-02: should return RegistryEntry with bundleId "core" for filter pipe', async () => {
      const entry = await registry.get('filter')

      expect(entry).toBeDefined()
      expect(entry!.bundleId).toBe('core')
      expect(entry!.key).toBe('filter')
      expect(entry!.value.id).toBe('filter')
      expect(entry!.value.type).toBe('pipe')
    })

    it('should return undefined for unknown pipe', async () => {
      const entry = await registry.get('nonexistent')

      expect(entry).toBeUndefined()
    })

    it('should return all 9 core pipes', async () => {
      const expectedPipes = [
        'filter',
        'map',
        'first',
        'last',
        'join',
        'length',
        'flatten',
        'reverse',
        'unique',
      ]

      for (const pipeId of expectedPipes) {
        const entry = await registry.get(pipeId)
        expect(entry).toBeDefined()
        expect(entry!.value.id).toBe(pipeId)
      }
    })
  })

  describe('Additional registry methods', () => {
    let registry: PipeRegistry

    beforeEach(async () => {
      registry = new PipeRegistry()
      registry.addBundle(new CorePipesBundle())
      await registry.reload()
    })

    it('should have has() method', async () => {
      expect(await registry.has('filter')).toBe(true)
      expect(await registry.has('nonexistent')).toBe(false)
    })

    it('should have keys() method', async () => {
      const keys = await registry.keys()

      expect(keys).toContain('filter')
      expect(keys).toContain('map')
      expect(keys).toHaveLength(9)
    })

    it('should have entries() method', async () => {
      const entries = await registry.entries()

      expect(entries).toBeInstanceOf(Map)
      expect(entries.size).toBe(9)
      expect(entries.get('filter')).toBeDefined()
    })
  })

  describe('Registry reload behavior', () => {
    it('should call dispose() on existing pipes when reloading', async () => {
      let disposeCount = 0

      class DisposableBundle implements RegistryBundle<PipeFunction> {
        readonly id = 'disposable'
        async load(): Promise<Map<string, PipeFunction>> {
          const pipes = new Map<string, PipeFunction>()
          pipes.set(
            'disposable-pipe',
            new (class extends BasePipeFunction {
              readonly id = 'disposable-pipe'
              async dispose(): Promise<void> {
                disposeCount++
              }
              async execute(input: any): Promise<any> {
                return input
              }
            })(),
          )
          return pipes
        }
      }

      const registry = new PipeRegistry()
      registry.addBundle(new DisposableBundle())

      await registry.reload()
      expect(disposeCount).toBe(0)

      await registry.reload()
      expect(disposeCount).toBe(1)

      await registry.reload()
      expect(disposeCount).toBe(2)
    })
  })
})
