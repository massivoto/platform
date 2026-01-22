import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryStore } from './in-memory-store.js'

describe('InMemoryStore', () => {
  let store: InMemoryStore

  beforeEach(() => {
    store = new InMemoryStore()
  })

  describe('get()', () => {
    it('should return undefined for missing key', async () => {
      expect(await store.get('missing')).toBeUndefined()
    })

    it('should return value for existing key', async () => {
      const storeWithData = new InMemoryStore({ name: 'Alice' })
      expect(await storeWithData.get('name')).toBe('Alice')
    })

    it('should support nested paths', async () => {
      const storeWithData = new InMemoryStore({
        user: { profile: { name: 'Bob' } },
      })
      expect(await storeWithData.get('user.profile.name')).toBe('Bob')
    })

    it('should return undefined for missing nested path', async () => {
      const storeWithData = new InMemoryStore({ user: {} })
      expect(await storeWithData.get('user.profile.name')).toBeUndefined()
    })
  })

  describe('set()', () => {
    it('should set a simple value', async () => {
      await store.set('count', 42)
      expect(await store.get('count')).toBe(42)
    })

    it('should set a nested value', async () => {
      await store.set('user.name', 'Carlos')
      expect(await store.get('user.name')).toBe('Carlos')
      expect(await store.get('user')).toEqual({ name: 'Carlos' })
    })

    it('should overwrite existing value', async () => {
      await store.set('count', 1)
      await store.set('count', 2)
      expect(await store.get('count')).toBe(2)
    })
  })

  describe('toSerializable()', () => {
    it('should return serializable pointer', () => {
      const pointer = store.toSerializable()
      expect(pointer.uri).toBe('memory://in-memory-store')
      expect(pointer.name).toBe('in-memory-store')
    })
  })

  describe('getData()', () => {
    it('should return copy of store data', async () => {
      await store.set('foo', 'bar')
      const data = store.getData()
      expect(data).toEqual({ foo: 'bar' })

      // Verify it's a copy (mutations don't affect store)
      data.foo = 'modified'
      expect(await store.get('foo')).toBe('bar')
    })
  })

  describe('clear()', () => {
    it('should clear all data', async () => {
      await store.set('a', 1)
      await store.set('b', 2)
      store.clear()
      expect(await store.get('a')).toBeUndefined()
      expect(await store.get('b')).toBeUndefined()
    })
  })
})
