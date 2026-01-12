import { describe, it, expect, beforeEach } from 'vitest'
import {
  InMemoryMockSessionStore,
  LocalStorageMockSessionStore,
  MockSessionStore,
  MockSessionStates,
  getDefaultMockUser,
} from './mock-session.js'
import { SimpleStorage } from './storage.js'

// Simple in-memory storage for testing LocalStorageMockSessionStore
class TestStorage implements SimpleStorage {
  private data = new Map<string, string>()

  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }

  removeItem(key: string): void {
    this.data.delete(key)
  }
}

describe('getDefaultMockUser', () => {
  it('returns github user for github provider', () => {
    const user = getDefaultMockUser('github')
    expect(user.id).toBe('mock-github-user-123')
    expect(user.email).toBe('mock@example.com')
  })

  it('returns google user for google provider', () => {
    const user = getDefaultMockUser('google')
    expect(user.id).toBe('mock-google-user-456')
    expect(user.email).toBe('mock@gmail.com')
  })

  it('returns github user for unknown provider', () => {
    const user = getDefaultMockUser('unknown')
    expect(user.id).toBe('mock-github-user-123')
  })
})

describe.each([
  ['InMemoryMockSessionStore', () => new InMemoryMockSessionStore()],
  ['LocalStorageMockSessionStore', () => new LocalStorageMockSessionStore(new TestStorage())],
])('%s', (_, createStore) => {
  let store: MockSessionStore

  beforeEach(() => {
    store = createStore()
    store.clear()
  })

  describe('createSession', () => {
    it('creates a session with valid state', () => {
      const session = store.createSession('github')

      expect(session.id).toBeDefined()
      expect(session.provider).toBe('github')
      expect(session.state).toBe('valid')
      expect(session.user.id).toBe('mock-github-user-123')
      expect(session.createdAt).toBeDefined()
      expect(session.expiresAt).toBeDefined()
    })

    it('uses default user for provider', () => {
      const session = store.createSession('google')

      expect(session.user.id).toBe('mock-google-user-456')
      expect(session.user.email).toBe('mock@gmail.com')
    })

    it('allows custom user override', () => {
      const session = store.createSession('github', {
        name: 'Custom User',
        email: 'custom@example.com',
      })

      expect(session.user.name).toBe('Custom User')
      expect(session.user.email).toBe('custom@example.com')
      expect(session.user.id).toBe('mock-github-user-123') // kept from default
    })

    it('generates unique session ids', () => {
      const session1 = store.createSession('github')
      const session2 = store.createSession('github')

      expect(session1.id).not.toBe(session2.id)
    })
  })

  describe('getSession', () => {
    it('returns session by id', () => {
      const created = store.createSession('github')
      const retrieved = store.getSession(created.id)

      expect(retrieved).toEqual(created)
    })

    it('returns null for non-existent session', () => {
      const session = store.getSession('non-existent')
      expect(session).toBeNull()
    })
  })

  describe('updateState', () => {
    it.each(MockSessionStates)('updates state to %s', (state) => {
      const session = store.createSession('github')
      store.updateState(session.id, state)

      const updated = store.getSession(session.id)
      expect(updated?.state).toBe(state)
    })

    it('does nothing for non-existent session', () => {
      // Should not throw
      store.updateState('non-existent', 'revoked')
    })
  })

  describe('deleteSession', () => {
    it('removes session', () => {
      const session = store.createSession('github')
      store.deleteSession(session.id)

      expect(store.getSession(session.id)).toBeNull()
    })

    it('does nothing for non-existent session', () => {
      // Should not throw
      store.deleteSession('non-existent')
    })
  })

  describe('listSessions', () => {
    it('returns empty array when no sessions', () => {
      expect(store.listSessions()).toEqual([])
    })

    it('returns all sessions', () => {
      store.createSession('github')
      store.createSession('google')

      const sessions = store.listSessions()
      expect(sessions).toHaveLength(2)
    })
  })

  describe('clear', () => {
    it('removes all sessions', () => {
      store.createSession('github')
      store.createSession('google')
      store.clear()

      expect(store.listSessions()).toEqual([])
    })
  })
})
