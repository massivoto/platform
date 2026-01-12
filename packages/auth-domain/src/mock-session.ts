import { z } from 'zod'
import { SimpleStorage } from './storage.js'

// ============================================================================
// Mock Session State
// ============================================================================

export const MockSessionStates = ['valid', 'expired', 'revoked'] as const
export type MockSessionState = (typeof MockSessionStates)[number]
export const MockSessionStateSchema = z.enum(MockSessionStates)

// ============================================================================
// Mock User
// ============================================================================

export interface MockUser {
  id: string
  email: string
  name: string
}

export const MockUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
})

// ============================================================================
// Mock Session
// ============================================================================

export interface MockSession {
  id: string
  provider: string
  state: MockSessionState
  user: MockUser
  createdAt: string
  expiresAt: string
}

export const MockSessionSchema = z.object({
  id: z.string(),
  provider: z.string(),
  state: MockSessionStateSchema,
  user: MockUserSchema,
  createdAt: z.string(),
  expiresAt: z.string(),
})

// ============================================================================
// Mock Session Store Interface
// ============================================================================

export interface MockSessionStore {
  createSession(provider: string, user?: Partial<MockUser>): MockSession
  getSession(sessionId: string): MockSession | null
  updateState(sessionId: string, state: MockSessionState): void
  deleteSession(sessionId: string): void
  listSessions(): MockSession[]
  clear(): void
}

// ============================================================================
// Default Mock Users per Provider
// ============================================================================

export const DEFAULT_MOCK_USERS: Record<string, MockUser> = {
  github: {
    id: 'mock-github-user-123',
    email: 'mock@example.com',
    name: 'Mock GitHub User',
  },
  google: {
    id: 'mock-google-user-456',
    email: 'mock@gmail.com',
    name: 'Mock Google User',
  },
}

export function getDefaultMockUser(provider: string): MockUser {
  return DEFAULT_MOCK_USERS[provider] ?? DEFAULT_MOCK_USERS.github
}

// ============================================================================
// ID Generation
// ============================================================================

function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15)
}

// ============================================================================
// In-Memory Implementation
// ============================================================================

export class InMemoryMockSessionStore implements MockSessionStore {
  private sessions = new Map<string, MockSession>()

  createSession(provider: string, user?: Partial<MockUser>): MockSession {
    const id = generateSessionId()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 3600 * 1000) // 1 hour

    const session: MockSession = {
      id,
      provider,
      state: 'valid',
      user: {
        ...getDefaultMockUser(provider),
        ...user,
      },
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    }

    this.sessions.set(id, session)
    return session
  }

  getSession(sessionId: string): MockSession | null {
    return this.sessions.get(sessionId) ?? null
  }

  updateState(sessionId: string, state: MockSessionState): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.state = state
    }
  }

  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId)
  }

  listSessions(): MockSession[] {
    return Array.from(this.sessions.values())
  }

  clear(): void {
    this.sessions.clear()
  }
}

// ============================================================================
// LocalStorage Implementation
// ============================================================================

const STORAGE_KEY = 'mock_sessions'

export class LocalStorageMockSessionStore implements MockSessionStore {
  constructor(private storage: SimpleStorage) {}

  private loadSessions(): Map<string, MockSession> {
    const data = this.storage.getItem(STORAGE_KEY)
    if (!data) return new Map()

    try {
      const parsed = JSON.parse(data) as Record<string, MockSession>
      return new Map(Object.entries(parsed))
    } catch {
      return new Map()
    }
  }

  private saveSessions(sessions: Map<string, MockSession>): void {
    const obj = Object.fromEntries(sessions)
    this.storage.setItem(STORAGE_KEY, JSON.stringify(obj))
  }

  createSession(provider: string, user?: Partial<MockUser>): MockSession {
    const sessions = this.loadSessions()
    const id = generateSessionId()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 3600 * 1000)

    const session: MockSession = {
      id,
      provider,
      state: 'valid',
      user: {
        ...getDefaultMockUser(provider),
        ...user,
      },
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    }

    sessions.set(id, session)
    this.saveSessions(sessions)
    return session
  }

  getSession(sessionId: string): MockSession | null {
    const sessions = this.loadSessions()
    return sessions.get(sessionId) ?? null
  }

  updateState(sessionId: string, state: MockSessionState): void {
    const sessions = this.loadSessions()
    const session = sessions.get(sessionId)
    if (session) {
      session.state = state
      this.saveSessions(sessions)
    }
  }

  deleteSession(sessionId: string): void {
    const sessions = this.loadSessions()
    sessions.delete(sessionId)
    this.saveSessions(sessions)
  }

  listSessions(): MockSession[] {
    return Array.from(this.loadSessions().values())
  }

  clear(): void {
    this.storage.removeItem(STORAGE_KEY)
  }
}
