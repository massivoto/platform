/**
 * ModuleBundle tests.
 *
 * Theme: Record Store
 * Testing the loading of album catalogs from distributor modules.
 */

import { describe, it, expect } from 'vitest'
import { ModuleBundle } from './module-bundle.js'
import { ModuleLoadError } from './errors.js'
import { Album, fixtureAdapter } from './fixtures/types.js'

const VINYL_CLASSICS = new URL('./fixtures/vinyl-classics.js', import.meta.url)
  .href
const EMPTY_DISTRIBUTOR = new URL(
  './fixtures/empty-distributor.js',
  import.meta.url,
).href

describe('ModuleBundle', () => {
  describe('when Vinyl Classics delivers their catalog', () => {
    it('loads all albums from the module', async () => {
      const bundle = new ModuleBundle<Album>({
        id: 'vinyl-classics',
        modulePath: VINYL_CLASSICS,
        adapter: fixtureAdapter,
      })

      const entries = await bundle.load()

      expect(entries.size).toBe(2)
      expect(entries.get('@classics/abbey-road')?.title).toBe('Abbey Road')
      expect(entries.get('@classics/let-it-be')?.title).toBe('Let It Be')
    })

    it('exposes the bundle id', () => {
      const bundle = new ModuleBundle<Album>({
        id: 'vinyl-classics',
        modulePath: VINYL_CLASSICS,
        adapter: fixtureAdapter,
      })

      expect(bundle.id).toBe('vinyl-classics')
    })
  })

  describe('when a distributor has no albums', () => {
    it('returns an empty map', async () => {
      const bundle = new ModuleBundle<Album>({
        id: 'empty-distributor',
        modulePath: EMPTY_DISTRIBUTOR,
        adapter: fixtureAdapter,
      })

      const entries = await bundle.load()

      expect(entries.size).toBe(0)
    })
  })

  describe('when the module path is invalid', () => {
    it('throws ModuleLoadError with descriptive message', async () => {
      const bundle = new ModuleBundle<Album>({
        id: 'broken',
        modulePath: './non-existent-module.js',
        adapter: fixtureAdapter,
      })

      await expect(bundle.load()).rejects.toThrow(ModuleLoadError)

      try {
        await bundle.load()
      } catch (error) {
        expect(error).toBeInstanceOf(ModuleLoadError)
        const loadError = error as ModuleLoadError
        expect(loadError.modulePath).toBe('./non-existent-module.js')
        expect(loadError.message).toContain('./non-existent-module.js')
      }
    })
  })

  describe('when the adapter throws an error', () => {
    it('throws ModuleLoadError wrapping the adapter error', async () => {
      const brokenAdapter = () => {
        throw new Error('Adapter failed to process exports')
      }

      const bundle = new ModuleBundle<Album>({
        id: 'broken-adapter',
        modulePath: VINYL_CLASSICS,
        adapter: brokenAdapter,
      })

      await expect(bundle.load()).rejects.toThrow(ModuleLoadError)

      try {
        await bundle.load()
      } catch (error) {
        expect(error).toBeInstanceOf(ModuleLoadError)
        const loadError = error as ModuleLoadError
        expect(loadError.message).toContain('Adapter failed to process exports')
      }
    })
  })

  describe('custom adapters', () => {
    it('can transform module exports in any format', async () => {
      // Custom adapter that transforms differently
      const customAdapter = (exports: unknown) => {
        const typed = exports as {
          albums: Array<{ key: string; value: Album }>
        }
        const map = new Map<string, Album>()
        for (const { key, value } of typed.albums) {
          // Prefix all keys with "custom:"
          map.set(`custom:${key}`, value)
        }
        return map
      }

      const bundle = new ModuleBundle<Album>({
        id: 'custom',
        modulePath: VINYL_CLASSICS,
        adapter: customAdapter,
      })

      const entries = await bundle.load()

      expect(entries.has('custom:@classics/abbey-road')).toBe(true)
      expect(entries.has('@classics/abbey-road')).toBe(false)
    })
  })
})
