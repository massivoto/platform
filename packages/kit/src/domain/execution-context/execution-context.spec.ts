import { describe, it, expect, vi } from 'vitest'
import {
  createEmptyExecutionContext,
  cloneExecutionContext,
  fromPartialContext,
} from './core-context'

import { createEmptyScopeChain, pushScope } from '../scope/scope-chain.js'
import { AppletInstance, AppletLauncher } from '../../applets/index.js'

/**
 * Test file: execution-context.spec.ts
 * Theme: Social Media Automation (Emma, Carlos, tweet, followers)
 *
 * Note: ActionLog tests are now in action-log.spec.ts
 */

describe('ExecutionContext', () => {
  describe('createEmptyExecutionContext', () => {
    it('should initialize with user id', () => {
      const context = createEmptyExecutionContext('emma-123')

      expect(context.user.id).toBe('emma-123')
    })

    it('should initialize meta with updatedAt', () => {
      const context = createEmptyExecutionContext('carlos-456')

      expect(context.meta.updatedAt).toBeDefined()
    })
  })

  describe('cloneExecutionContext', () => {
    it('should clone data independently', () => {
      const original = createEmptyExecutionContext('emma-123')
      original.data.followers = 1500

      const cloned = cloneExecutionContext(original)
      cloned.data.followers = 2000

      expect(original.data.followers).toBe(1500)
      expect(cloned.data.followers).toBe(2000)
    })
  })
})

/**
 * Tests for ScopeChain in ExecutionContext (R-SCOPE-01 to R-SCOPE-04)
 * Theme: Social Media Automation (Emma, Carlos, tweet, followers)
 */
describe('ExecutionContext ScopeChain', () => {
  describe('R-SCOPE-01: ExecutionContext has scopeChain property', () => {
    it('should have scopeChain property', () => {
      const context = createEmptyExecutionContext('emma-123')

      expect(context.scopeChain).toBeDefined()
      expect(context.scopeChain.current).toBeDefined()
    })
  })

  describe('R-SCOPE-02: createEmptyExecutionContext initializes scopeChain', () => {
    it('should initialize scopeChain to { current: {} }', () => {
      const context = createEmptyExecutionContext('emma-123')

      expect(context.scopeChain).toEqual({ current: {} })
      expect(context.scopeChain.parent).toBeUndefined()
    })

    it('should have empty current scope', () => {
      const context = createEmptyExecutionContext('carlos-456')

      expect(Object.keys(context.scopeChain.current)).toHaveLength(0)
    })
  })

  describe('R-SCOPE-03: cloneExecutionContext deep-clones scopeChain', () => {
    it('should deep clone scopeChain', () => {
      const original = createEmptyExecutionContext('emma-123')
      original.scopeChain.current.user = 'Emma'

      const cloned = cloneExecutionContext(original)

      // Different object references
      expect(cloned.scopeChain).not.toBe(original.scopeChain)
      expect(cloned.scopeChain.current).not.toBe(original.scopeChain.current)

      // Same values
      expect(cloned.scopeChain.current.user).toBe('Emma')
    })

    it('should preserve parent chain in clone', () => {
      const original = createEmptyExecutionContext('emma-123')
      const parent = createEmptyScopeChain()
      parent.current.globalUser = 'Admin'

      const child = pushScope(parent)
      child.current.user = 'Emma'

      original.scopeChain = child

      const cloned = cloneExecutionContext(original)

      // Verify parent chain preserved
      expect(cloned.scopeChain.current.user).toBe('Emma')
      expect(cloned.scopeChain.parent?.current.globalUser).toBe('Admin')

      // Verify independence
      cloned.scopeChain.current.user = 'Carlos'
      expect(original.scopeChain.current.user).toBe('Emma')
    })

    it('should allow independent modification after clone', () => {
      const original = createEmptyExecutionContext('emma-123')
      original.scopeChain.current.tweet = 'Hello!'

      const cloned = cloneExecutionContext(original)
      cloned.scopeChain.current.tweet = 'Goodbye!'
      cloned.scopeChain.current.newKey = 'New value'

      expect(original.scopeChain.current.tweet).toBe('Hello!')
      expect(original.scopeChain.current.newKey).toBeUndefined()
    })
  })

  describe('R-SCOPE-04: fromPartialContext handles optional scopeChain', () => {
    it('should use provided scopeChain', () => {
      const customScopeChain = createEmptyScopeChain()
      customScopeChain.current.user = 'Emma'
      customScopeChain.current.followers = 1500

      const context = fromPartialContext({
        scopeChain: customScopeChain,
      })

      expect(context.scopeChain.current.user).toBe('Emma')
      expect(context.scopeChain.current.followers).toBe(1500)
    })

    it('should create empty scopeChain when not provided', () => {
      const context = fromPartialContext({
        data: { someData: 'value' },
      })

      expect(context.scopeChain).toBeDefined()
      expect(context.scopeChain.current).toEqual({})
    })

    it('should handle partial context with nested scopeChain', () => {
      const parent = createEmptyScopeChain()
      parent.current.outer = 'outer-value'

      const child = pushScope(parent)
      child.current.inner = 'inner-value'

      const context = fromPartialContext({
        scopeChain: child,
        user: { id: 'carlos-456', extra: {} },
      })

      expect(context.scopeChain.current.inner).toBe('inner-value')
      expect(context.scopeChain.parent?.current.outer).toBe('outer-value')
    })
  })
})

/**
 * Tests for new ExecutionContext fields (R-CONFIRM-121 to R-CONFIRM-123)
 * Theme: Social Media Automation (Emma, Carlos, tweet, followers)
 *
 * These fields support the @human/confirm handler and program status tracking.
 */
describe('ExecutionContext Runtime Fields', () => {
  describe('R-CONFIRM-121: userLogs field', () => {
    it('should have userLogs field initialized to empty array', () => {
      const context = createEmptyExecutionContext('emma-123')

      expect(context.userLogs).toBeDefined()
      expect(context.userLogs).toEqual([])
    })

    it('should allow appending to userLogs', () => {
      const context = createEmptyExecutionContext('emma-123')

      context.userLogs.push('Tweet posted by Emma')
      context.userLogs.push('Carlos liked the tweet')

      expect(context.userLogs).toHaveLength(2)
      expect(context.userLogs[0]).toBe('Tweet posted by Emma')
      expect(context.userLogs[1]).toBe('Carlos liked the tweet')
    })

    it('should clone userLogs independently', () => {
      const original = createEmptyExecutionContext('emma-123')
      original.userLogs.push('Original log entry')

      const cloned = cloneExecutionContext(original)
      cloned.userLogs.push('Cloned log entry')

      expect(original.userLogs).toHaveLength(1)
      expect(cloned.userLogs).toHaveLength(2)
    })

    it('should preserve userLogs in fromPartialContext', () => {
      const context = fromPartialContext({
        userLogs: ['Previous log', 'Another log'],
      })

      expect(context.userLogs).toEqual(['Previous log', 'Another log'])
    })

    it('should initialize userLogs to empty when not provided in partial', () => {
      const context = fromPartialContext({
        data: { tweet: 'Hello world' },
      })

      expect(context.userLogs).toEqual([])
    })
  })

  describe('R-CONFIRM-122: status field', () => {
    it('should have status field initialized to running', () => {
      const context = createEmptyExecutionContext('emma-123')

      expect(context.status).toBe('running')
    })

    it('should allow setting status to waitingHumanValidation', () => {
      const context = createEmptyExecutionContext('emma-123')

      context.status = 'waitingHumanValidation'

      expect(context.status).toBe('waitingHumanValidation')
    })

    it('should allow setting status to finished', () => {
      const context = createEmptyExecutionContext('emma-123')

      context.status = 'finished'

      expect(context.status).toBe('finished')
    })

    it('should allow setting status to error', () => {
      const context = createEmptyExecutionContext('emma-123')

      context.status = 'error'

      expect(context.status).toBe('error')
    })

    it('should clone status independently', () => {
      const original = createEmptyExecutionContext('emma-123')
      original.status = 'waitingHumanValidation'

      const cloned = cloneExecutionContext(original)
      cloned.status = 'finished'

      expect(original.status).toBe('waitingHumanValidation')
      expect(cloned.status).toBe('finished')
    })

    it('should preserve status in fromPartialContext', () => {
      const context = fromPartialContext({
        status: 'waitingHumanValidation',
      })

      expect(context.status).toBe('waitingHumanValidation')
    })

    it('should initialize status to running when not provided in partial', () => {
      const context = fromPartialContext({
        data: { tweet: 'Hello world' },
      })

      expect(context.status).toBe('running')
    })
  })

  describe('R-CONFIRM-123: appletLauncher field', () => {
    it('should have appletLauncher field as undefined by default', () => {
      const context = createEmptyExecutionContext('emma-123')

      expect(context.appletLauncher).toBeUndefined()
    })

    it('should allow setting appletLauncher', () => {
      const context = createEmptyExecutionContext('emma-123')

      const mockLauncher: AppletLauncher = {
        launch: vi.fn().mockResolvedValue({
          id: 'instance-1',
          url: 'http://localhost:3000',
          appletId: 'confirm',
          terminator: { terminate: vi.fn(), isTerminated: false },
          waitForResponse: vi.fn(),
        } as AppletInstance),
      }

      context.appletLauncher = mockLauncher

      expect(context.appletLauncher).toBe(mockLauncher)
    })

    it('should preserve appletLauncher reference in clone (not deep copied)', () => {
      const original = createEmptyExecutionContext('emma-123')

      const mockLauncher: AppletLauncher = {
        launch: vi.fn(),
      }
      original.appletLauncher = mockLauncher

      const cloned = cloneExecutionContext(original)

      // AppletLauncher is a stateful service, should be same reference
      expect(cloned.appletLauncher).toBe(mockLauncher)
    })

    it('should preserve appletLauncher in fromPartialContext', () => {
      const mockLauncher: AppletLauncher = {
        launch: vi.fn(),
      }

      const context = fromPartialContext({
        appletLauncher: mockLauncher,
      })

      expect(context.appletLauncher).toBe(mockLauncher)
    })
  })
})
