import { describe, it, expect } from 'vitest'
import {
  createEmptyExecutionContext,
  cloneExecutionContext,
  fromPartialContext,
} from './execution-context.js'
import { createEmptyScopeChain, pushScope } from '../interpreter/evaluator/scope-chain.js'

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
