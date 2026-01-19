/**
 * BaseComposableRegistry tests.
 *
 * Theme: Record Store
 * A vinyl record store with multiple distributors (sources).
 * Each distributor provides albums (registry items).
 */

import { describe, it, expect, vi } from 'vitest'
import { BaseComposableRegistry } from './base-composable-registry.js'
import { ModuleSource } from './module-source.js'
import { RegistryConflictError, RegistryNotLoadedError } from './errors.js'
import { Album, fixtureAdapter } from './fixtures/types.js'

// Fixture paths (relative to this file's compiled location)
const VINYL_CLASSICS = new URL('./fixtures/vinyl-classics.js', import.meta.url)
  .href
const RETRO_BEATS = new URL('./fixtures/retro-beats.js', import.meta.url).href
const LOCAL_INDIE = new URL('./fixtures/local-indie.js', import.meta.url).href
const EMPTY_DISTRIBUTOR = new URL(
  './fixtures/empty-distributor.js',
  import.meta.url,
).href

function createVinylClassicsSource() {
  return new ModuleSource<Album>({
    id: 'vinyl-classics',
    modulePath: VINYL_CLASSICS,
    adapter: fixtureAdapter,
  })
}

function createRetroBeatsSource() {
  return new ModuleSource<Album>({
    id: 'retro-beats',
    modulePath: RETRO_BEATS,
    adapter: fixtureAdapter,
  })
}

function createLocalIndieSource() {
  return new ModuleSource<Album>({
    id: 'local-indie',
    modulePath: LOCAL_INDIE,
    adapter: fixtureAdapter,
  })
}

function createEmptySource() {
  return new ModuleSource<Album>({
    id: 'empty-distributor',
    modulePath: EMPTY_DISTRIBUTOR,
    adapter: fixtureAdapter,
  })
}

describe('BaseComposableRegistry', () => {
  describe('when clerk Emma searches the store inventory', () => {
    it('finds Abbey Road after Vinyl Classics delivers their catalog', async () => {
      const store = new BaseComposableRegistry<Album>()
      store.addSource(createVinylClassicsSource())

      await store.reload()

      const entry = await store.get('@classics/abbey-road')
      expect(entry).toBeDefined()
      expect(entry!.value.title).toBe('Abbey Road')
      expect(entry!.value.artist).toBe('The Beatles')
      expect(entry!.sourceId).toBe('vinyl-classics')
    })

    it('finds both jazz albums from Local Indie', async () => {
      const store = new BaseComposableRegistry<Album>()
      store.addSource(createLocalIndieSource())

      await store.reload()

      const blueTrain = await store.get('@indie/blue-train')
      const kindOfBlue = await store.get('@indie/kind-of-blue')

      expect(blueTrain?.value.title).toBe('Blue Train')
      expect(kindOfBlue?.value.title).toBe('Kind of Blue')
    })

    it('returns undefined for albums not in stock', async () => {
      const store = new BaseComposableRegistry<Album>()
      store.addSource(createVinylClassicsSource())

      await store.reload()

      const entry = await store.get('@unknown/album')
      expect(entry).toBeUndefined()
    })
  })

  describe('when the store has not received any deliveries yet', () => {
    it('Emma receives an error explaining inventory must be loaded first', async () => {
      const store = new BaseComposableRegistry<Album>()
      store.addSource(createVinylClassicsSource())
      // Note: reload() not called

      await expect(store.get('@classics/abbey-road')).rejects.toThrow(
        RegistryNotLoadedError,
      )
    })

    it('has() also requires loading first', async () => {
      const store = new BaseComposableRegistry<Album>()

      await expect(store.has('@classics/abbey-road')).rejects.toThrow(
        RegistryNotLoadedError,
      )
    })

    it('keys() also requires loading first', async () => {
      const store = new BaseComposableRegistry<Album>()

      await expect(store.keys()).rejects.toThrow(RegistryNotLoadedError)
    })

    it('entries() also requires loading first', async () => {
      const store = new BaseComposableRegistry<Album>()

      await expect(store.entries()).rejects.toThrow(RegistryNotLoadedError)
    })
  })

  describe('when Vinyl Classics and Retro Beats both ship Abbey Road', () => {
    it('the store manager receives a conflict error listing both distributors', async () => {
      const store = new BaseComposableRegistry<Album>()
      store.addSource(createVinylClassicsSource())
      store.addSource(createRetroBeatsSource())

      await expect(store.reload()).rejects.toThrow(RegistryConflictError)

      try {
        await store.reload()
      } catch (error) {
        expect(error).toBeInstanceOf(RegistryConflictError)
        const conflictError = error as RegistryConflictError
        expect(conflictError.conflicts).toHaveLength(1)
        expect(conflictError.conflicts[0].key).toBe('@classics/abbey-road')
        expect(conflictError.conflicts[0].sourceIds).toContain('vinyl-classics')
        expect(conflictError.conflicts[0].sourceIds).toContain('retro-beats')
      }
    })
  })

  describe('when the store has no distributors', () => {
    it('inventory loads successfully but is empty', async () => {
      const store = new BaseComposableRegistry<Album>()

      await store.reload()

      const keys = await store.keys()
      expect(keys).toHaveLength(0)
    })
  })

  describe('when a distributor has no albums', () => {
    it('the store loads successfully with empty inventory from that source', async () => {
      const store = new BaseComposableRegistry<Album>()
      store.addSource(createEmptySource())

      await store.reload()

      const keys = await store.keys()
      expect(keys).toHaveLength(0)
    })
  })

  describe('when combining multiple distributors without conflicts', () => {
    it('the store stocks albums from all distributors', async () => {
      const store = new BaseComposableRegistry<Album>()
      store.addSource(createVinylClassicsSource())
      store.addSource(createLocalIndieSource())

      await store.reload()

      const keys = await store.keys()
      expect(keys).toHaveLength(4) // 2 from vinyl-classics + 2 from local-indie

      expect(await store.has('@classics/abbey-road')).toBe(true)
      expect(await store.has('@classics/let-it-be')).toBe(true)
      expect(await store.has('@indie/blue-train')).toBe(true)
      expect(await store.has('@indie/kind-of-blue')).toBe(true)
    })

    it('tracks which distributor provided each album', async () => {
      const store = new BaseComposableRegistry<Album>()
      store.addSource(createVinylClassicsSource())
      store.addSource(createLocalIndieSource())

      await store.reload()

      const abbeyRoad = await store.get('@classics/abbey-road')
      const blueTrain = await store.get('@indie/blue-train')

      expect(abbeyRoad?.sourceId).toBe('vinyl-classics')
      expect(blueTrain?.sourceId).toBe('local-indie')
    })
  })

  describe('lifecycle management', () => {
    it('calls init() on all albums after loading', async () => {
      const initSpy = vi.fn().mockResolvedValue(undefined)
      const disposeSpy = vi.fn().mockResolvedValue(undefined)

      const mockSource = {
        id: 'mock',
        load: async () =>
          new Map([
            [
              '@mock/album',
              {
                id: '@mock/album',
                kind: 'album' as const,
                title: 'Mock Album',
                artist: 'Mock Artist',
                year: 2024,
                init: initSpy,
                dispose: disposeSpy,
              },
            ],
          ]),
      }

      const store = new BaseComposableRegistry<Album>()
      store.addSource(mockSource)

      await store.reload()

      expect(initSpy).toHaveBeenCalledTimes(1)
    })

    it('calls dispose() on existing albums before reloading', async () => {
      const firstInitSpy = vi.fn().mockResolvedValue(undefined)
      const firstDisposeSpy = vi.fn().mockResolvedValue(undefined)
      const secondInitSpy = vi.fn().mockResolvedValue(undefined)

      let loadCount = 0
      const mockSource = {
        id: 'mock',
        load: async () => {
          loadCount++
          if (loadCount === 1) {
            return new Map([
              [
                '@mock/album',
                {
                  id: '@mock/album',
                  kind: 'album' as const,
                  title: 'First Load',
                  artist: 'Artist',
                  year: 2024,
                  init: firstInitSpy,
                  dispose: firstDisposeSpy,
                },
              ],
            ])
          } else {
            return new Map([
              [
                '@mock/album',
                {
                  id: '@mock/album',
                  kind: 'album' as const,
                  title: 'Second Load',
                  artist: 'Artist',
                  year: 2024,
                  init: secondInitSpy,
                  dispose: vi.fn(),
                },
              ],
            ])
          }
        },
      }

      const store = new BaseComposableRegistry<Album>()
      store.addSource(mockSource)

      // First load
      await store.reload()
      expect(firstInitSpy).toHaveBeenCalledTimes(1)
      expect(firstDisposeSpy).not.toHaveBeenCalled()

      // Second load (reload)
      await store.reload()
      expect(firstDisposeSpy).toHaveBeenCalledTimes(1)
      expect(secondInitSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('idempotent reload', () => {
    it('can be called multiple times successfully', async () => {
      const store = new BaseComposableRegistry<Album>()
      store.addSource(createVinylClassicsSource())

      await store.reload()
      await store.reload()
      await store.reload()

      const entry = await store.get('@classics/abbey-road')
      expect(entry?.value.title).toBe('Abbey Road')
    })
  })

  describe('getSources', () => {
    it('returns all registered sources', () => {
      const store = new BaseComposableRegistry<Album>()
      const source1 = createVinylClassicsSource()
      const source2 = createLocalIndieSource()

      store.addSource(source1)
      store.addSource(source2)

      const sources = store.getSources()
      expect(sources).toHaveLength(2)
      expect(sources[0].id).toBe('vinyl-classics')
      expect(sources[1].id).toBe('local-indie')
    })
  })

  describe('entries', () => {
    it('returns all entries as a Map', async () => {
      const store = new BaseComposableRegistry<Album>()
      store.addSource(createVinylClassicsSource())

      await store.reload()

      const entries = await store.entries()
      expect(entries.size).toBe(2)
      expect(entries.get('@classics/abbey-road')?.value.title).toBe('Abbey Road')
    })
  })
})
