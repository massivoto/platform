import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { writeFile, unlink, mkdir, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { LocalFileStore } from './local-file-store.js'

/**
 * Test file: local-file-store.spec.ts
 * Theme: Social Media Automation (followers, users, posts)
 *
 * Tests for:
 * - R-PROVIDER-41: StoreProvider.get() returns Promise<any>
 * - R-PROVIDER-42: LocalFileStore implements async get (using fs.promises)
 */

describe('LocalFileStore', () => {
  const testDir = join(tmpdir(), 'massivoto-test-store')
  let testFilePath: string
  let store: LocalFileStore

  beforeEach(async () => {
    // Ensure test directory exists
    await mkdir(testDir, { recursive: true })
    testFilePath = join(testDir, `store-${Date.now()}.json`)
  })

  afterEach(async () => {
    // Clean up test file
    try {
      await unlink(testFilePath)
    } catch {
      // File may not exist, ignore
    }
  })

  describe('R-PROVIDER-41: get() returns Promise<any>', () => {
    it('should return a Promise when calling get()', async () => {
      // Setup: Create store file with followers count
      const storeData = { followers: 1500 }
      await writeFile(testFilePath, JSON.stringify(storeData))
      store = new LocalFileStore(testFilePath)

      // Act: Call get() and check it returns a Promise
      const result = store.get('followers')

      // Assert: Result is a Promise
      expect(result).toBeInstanceOf(Promise)
      expect(await result).toBe(1500)
    })

    it('should resolve Promise with the correct value', async () => {
      // Setup: Create store file with user data
      const storeData = {
        user: { name: 'Emma', verified: true },
        count: 42,
      }
      await writeFile(testFilePath, JSON.stringify(storeData))
      store = new LocalFileStore(testFilePath)

      // Assert: get() returns correct values
      expect(await store.get('count')).toBe(42)
      expect(await store.get('user')).toEqual({ name: 'Emma', verified: true })
    })
  })

  describe('R-PROVIDER-42: LocalFileStore implements async get', () => {
    it('should read simple value from JSON file', async () => {
      // Setup: Social media automation - store followers count
      const storeData = { followers: 2500 }
      await writeFile(testFilePath, JSON.stringify(storeData))
      store = new LocalFileStore(testFilePath)

      // Act & Assert
      expect(await store.get('followers')).toBe(2500)
    })

    it('should read nested path using lodash.get', async () => {
      // Setup: User with nested profile data
      const storeData = {
        user: {
          name: 'Carlos',
          profile: {
            bio: 'Tech enthusiast',
            settings: {
              theme: 'dark',
              notifications: true,
            },
          },
        },
      }
      await writeFile(testFilePath, JSON.stringify(storeData))
      store = new LocalFileStore(testFilePath)

      // Act & Assert: Read nested paths
      expect(await store.get('user.name')).toBe('Carlos')
      expect(await store.get('user.profile.bio')).toBe('Tech enthusiast')
      expect(await store.get('user.profile.settings.theme')).toBe('dark')
      expect(await store.get('user.profile.settings.notifications')).toBe(true)
    })

    it('should return undefined for missing paths', async () => {
      // Setup: Minimal store data
      const storeData = { existing: 'value' }
      await writeFile(testFilePath, JSON.stringify(storeData))
      store = new LocalFileStore(testFilePath)

      // Act & Assert: Missing paths return undefined
      expect(await store.get('missing')).toBeUndefined()
      expect(await store.get('missing.nested.path')).toBeUndefined()
    })

    it('should read array data', async () => {
      // Setup: Store with posts array
      const storeData = {
        posts: [
          { id: 'p1', likes: 100, author: 'Emma' },
          { id: 'p2', likes: 250, author: 'Carlos' },
        ],
      }
      await writeFile(testFilePath, JSON.stringify(storeData))
      store = new LocalFileStore(testFilePath)

      // Act & Assert: Read array and array elements
      const posts = await store.get('posts')
      expect(posts).toHaveLength(2)
      expect(posts[0].author).toBe('Emma')
      expect(await store.get('posts.0.likes')).toBe(100)
      expect(await store.get('posts.1.author')).toBe('Carlos')
    })

    it('should handle null values', async () => {
      // Setup: Store with null value
      const storeData = { value: null }
      await writeFile(testFilePath, JSON.stringify(storeData))
      store = new LocalFileStore(testFilePath)

      // Act & Assert
      expect(await store.get('value')).toBeNull()
    })
  })

  describe('set() async write', () => {
    it('should write value to JSON file', async () => {
      // Setup: Start with empty store
      const storeData = {}
      await writeFile(testFilePath, JSON.stringify(storeData))
      store = new LocalFileStore(testFilePath)

      // Act: Write a new value
      await store.set('followers', 3000)

      // Assert: Value is persisted and readable
      expect(await store.get('followers')).toBe(3000)
    })

    it('should write nested path to JSON file', async () => {
      // Setup: Store with existing data
      const storeData = { user: { name: 'Emma' } }
      await writeFile(testFilePath, JSON.stringify(storeData))
      store = new LocalFileStore(testFilePath)

      // Act: Write nested value
      await store.set('user.followers', 1500)

      // Assert: Nested value is persisted
      expect(await store.get('user.followers')).toBe(1500)
      // Original value should still exist
      expect(await store.get('user.name')).toBe('Emma')
    })

    it('should overwrite existing value', async () => {
      // Setup: Store with initial count
      const storeData = { count: 42 }
      await writeFile(testFilePath, JSON.stringify(storeData))
      store = new LocalFileStore(testFilePath)

      // Act: Overwrite value
      await store.set('count', 100)

      // Assert: Value is updated
      expect(await store.get('count')).toBe(100)
    })
  })

  describe('toSerializable()', () => {
    it('should return serializable store pointer', async () => {
      // Setup
      const storeData = {}
      await writeFile(testFilePath, JSON.stringify(storeData))
      store = new LocalFileStore(testFilePath)

      // Act
      const pointer = store.toSerializable()

      // Assert
      expect(pointer.uri).toBe(`file://${testFilePath}`)
      expect(pointer.name).toBe('local-file-store')
      expect(pointer.option).toBeUndefined()
    })
  })
})
