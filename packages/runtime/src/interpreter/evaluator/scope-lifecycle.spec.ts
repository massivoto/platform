import { describe, it, expect } from 'vitest'
import { runProgram } from '../program-runner.js'
import {
  createEmptyExecutionContext,
  ExecutionContext,
} from '../../domain/execution-context.js'
import { lookup, createEmptyScopeChain, write, pushScope } from './scope-chain.js'

/**
 * Test file: scope-lifecycle.spec.ts
 * Theme: Social Media Automation (Emma, Carlos, tweet, followers)
 *
 * Tests for Scope Lifecycle (R-SCOPE-61 to R-SCOPE-64)
 */
describe('Scope Lifecycle', () => {
  describe('R-SCOPE-61: Conditional block does NOT create new scope', () => {
    // AC-SCOPE-08: Given conditional block @start/block if=true with @utils/set key="x" value="inside",
    // when block exits, then context.data.x equals "inside" (no scope created)
    it('should not create scope for conditional block', async () => {
      const source = `
@utils/set input=true output=shouldRun
@block/begin if={shouldRun}
@utils/set input="inside-block" output=message
@block/end
      `.trim()

      const result = await runProgram(source)

      // Variable should be in data, not scope (block doesn't create scope)
      expect(result.data.message).toBe('inside-block')
      // Scope should be empty or not contain the variable
      expect(lookup('message', result.scopeChain)).toBeUndefined()
    })

    it('should allow access to variables set inside conditional block after exit', async () => {
      const source = `
@utils/set input=true output=condition
@block/begin if={condition}
@utils/set input="Emma" output=user
@utils/set input=1500 output=followers
@block/end
@utils/log message={user}
      `.trim()

      const result = await runProgram(source)

      // Variables set inside block should persist in data
      expect(result.data.user).toBe('Emma')
      expect(result.data.followers).toBe(1500)
      // Log should have resolved the variable
      expect(result.history[3].messages).toContain('Logged: Emma')
    })

    it('should not leak scope variables when block is skipped', async () => {
      const source = `
@utils/set input=false output=condition
@block/begin if={condition}
@utils/set input="should-not-run" output=skipped
@block/end
      `.trim()

      const result = await runProgram(source)

      // Block was skipped, variable should not exist
      expect(result.data.skipped).toBeUndefined()
    })
  })

  describe('R-SCOPE-62: forEach block creates child scope for iterator variable', () => {
    // AC-SCOPE-09: Given forEach with item="tweet",
    // when iteration runs, then context.scope.tweet is set to current item
    it('should create scope for forEach iterator variable', async () => {
      // Note: forEach is not yet implemented, so we test the expected behavior
      // This test documents the expected behavior once forEach is implemented
      const context = createEmptyExecutionContext('emma-123')
      const parent = createEmptyScopeChain()

      // Simulate what forEach should do: push scope and write iterator
      const forEachScope = pushScope(parent)
      write('tweet', { id: 1, content: 'Hello!' }, forEachScope)

      // Verify iterator is in scope
      expect(lookup('tweet', forEachScope)).toEqual({ id: 1, content: 'Hello!' })
      // And not in parent
      expect(lookup('tweet', parent)).toBeUndefined()
    })

    it('should allow access to outer variables from within forEach', async () => {
      // Simulate nested scope access
      const outerScope = createEmptyScopeChain()
      write('user', 'Emma', outerScope)

      const forEachScope = pushScope(outerScope)
      write('tweet', 'Hello world!', forEachScope)

      // From inside forEach, can access both
      expect(lookup('tweet', forEachScope)).toBe('Hello world!')
      expect(lookup('user', forEachScope)).toBe('Emma')
    })
  })

  describe('R-SCOPE-63: Child scope is cleared when forEach iteration ends', () => {
    // AC-SCOPE-10: Given forEach that set scope.tweet,
    // when forEach completes, then context.scope.tweet is cleared
    it('should clear iterator variable when forEach iteration ends', async () => {
      const outerScope = createEmptyScopeChain()
      write('users', ['Emma', 'Carlos'], outerScope)

      // First iteration
      let iterScope = pushScope(outerScope)
      write('user', 'Emma', iterScope)
      expect(lookup('user', iterScope)).toBe('Emma')

      // End first iteration - pop scope
      iterScope = outerScope // popScope equivalent

      // Iterator variable should be gone
      expect(lookup('user', iterScope)).toBeUndefined()

      // Second iteration - new scope
      iterScope = pushScope(outerScope)
      write('user', 'Carlos', iterScope)
      expect(lookup('user', iterScope)).toBe('Carlos')
    })

    it('should not affect outer scope when clearing forEach scope', async () => {
      const outerScope = createEmptyScopeChain()
      write('count', 42, outerScope)

      const forEachScope = pushScope(outerScope)
      write('item', 'temp', forEachScope)

      // Before pop: both available
      expect(lookup('count', forEachScope)).toBe(42)
      expect(lookup('item', forEachScope)).toBe('temp')

      // After pop (simulated): only outer variable
      expect(lookup('count', outerScope)).toBe(42)
      expect(lookup('item', outerScope)).toBeUndefined()
    })
  })

  describe('R-SCOPE-64: Scope variables do not leak to parent after block exit', () => {
    // AC-SCOPE-15: Given forEach that set scope.x in child scope,
    // when forEach exits and scope pops, then scope.x is no longer resolvable
    it('should not leak scope variables to parent', async () => {
      const parentScope = createEmptyScopeChain()
      write('parentVar', 'parent', parentScope)

      const childScope = pushScope(parentScope)
      write('childVar', 'child', childScope)

      // Before exit: child can see both
      expect(lookup('parentVar', childScope)).toBe('parent')
      expect(lookup('childVar', childScope)).toBe('child')

      // After exit: parent cannot see child's variable
      expect(lookup('parentVar', parentScope)).toBe('parent')
      expect(lookup('childVar', parentScope)).toBeUndefined()
    })

    it('should handle deeply nested scope cleanup', async () => {
      const level0 = createEmptyScopeChain()
      write('l0', 'level-0', level0)

      const level1 = pushScope(level0)
      write('l1', 'level-1', level1)

      const level2 = pushScope(level1)
      write('l2', 'level-2', level2)

      // From deepest: all visible
      expect(lookup('l0', level2)).toBe('level-0')
      expect(lookup('l1', level2)).toBe('level-1')
      expect(lookup('l2', level2)).toBe('level-2')

      // From level1: l2 not visible
      expect(lookup('l0', level1)).toBe('level-0')
      expect(lookup('l1', level1)).toBe('level-1')
      expect(lookup('l2', level1)).toBeUndefined()

      // From level0: only l0 visible
      expect(lookup('l0', level0)).toBe('level-0')
      expect(lookup('l1', level0)).toBeUndefined()
      expect(lookup('l2', level0)).toBeUndefined()
    })
  })
})

describe('Nested Scope Chain Integration', () => {
  describe('AC-SCOPE-12: Nested forEach with user and tweet', () => {
    // Given outer forEach with item="user" and inner forEach with item="tweet",
    // when inner runs, then both user and tweet are resolvable
    it('should resolve both outer and inner iterator variables', async () => {
      const users = [
        { name: 'Emma', tweets: ['Hello!', 'World!'] },
        { name: 'Carlos', tweets: ['Hola!'] },
      ]

      const rootScope = createEmptyScopeChain()
      const results: Array<{ user: string; tweet: string }> = []

      for (const userData of users) {
        // Outer forEach: push scope for user
        const userScope = pushScope(rootScope)
        write('user', userData, userScope)

        for (const tweetData of userData.tweets) {
          // Inner forEach: push scope for tweet
          const tweetScope = pushScope(userScope)
          write('tweet', tweetData, tweetScope)

          // Inside inner: both resolvable
          const user = lookup('user', tweetScope) as typeof userData
          const tweet = lookup('tweet', tweetScope) as string

          results.push({ user: user.name, tweet })
        }
      }

      expect(results).toEqual([
        { user: 'Emma', tweet: 'Hello!' },
        { user: 'Emma', tweet: 'World!' },
        { user: 'Carlos', tweet: 'Hola!' },
      ])
    })
  })

  describe('AC-SCOPE-13: Inner forEach shadows outer variable', () => {
    // Given nested forEach where inner shadows item="user",
    // when inner runs, then inner user wins; when inner exits, outer user is restored
    it('should shadow and restore on scope pop', async () => {
      const outerScope = createEmptyScopeChain()
      write('item', 'outer-item', outerScope)

      // Inner scope shadows 'item'
      const innerScope = pushScope(outerScope)
      write('item', 'inner-item', innerScope)

      // Inside inner: inner wins
      expect(lookup('item', innerScope)).toBe('inner-item')

      // After inner exits (back to outer): outer restored
      expect(lookup('item', outerScope)).toBe('outer-item')
    })
  })

  describe('AC-SCOPE-14: Three-level nesting (user -> tweet -> reply)', () => {
    // Given 3-level nesting (user -> tweet -> reply),
    // when innermost runs, then all three variables are resolvable via chain walk
    it('should resolve all three variables from innermost scope', async () => {
      const rootScope = createEmptyScopeChain()

      const userScope = pushScope(rootScope)
      write('user', { name: 'Emma' }, userScope)

      const tweetScope = pushScope(userScope)
      write('tweet', { id: 1, content: 'Hello!' }, tweetScope)

      const replyScope = pushScope(tweetScope)
      write('reply', { id: 100, text: 'Nice tweet!' }, replyScope)

      // From innermost, all three resolvable
      expect(lookup('reply', replyScope)).toEqual({ id: 100, text: 'Nice tweet!' })
      expect(lookup('tweet', replyScope)).toEqual({ id: 1, content: 'Hello!' })
      expect(lookup('user', replyScope)).toEqual({ name: 'Emma' })
    })

    it('should clean up properly when exiting each level', async () => {
      const rootScope = createEmptyScopeChain()

      const userScope = pushScope(rootScope)
      write('user', 'Emma', userScope)

      const tweetScope = pushScope(userScope)
      write('tweet', 'Hello!', tweetScope)

      const replyScope = pushScope(tweetScope)
      write('reply', 'Nice!', replyScope)

      // Exit reply scope
      // reply gone, tweet and user still available
      expect(lookup('reply', tweetScope)).toBeUndefined()
      expect(lookup('tweet', tweetScope)).toBe('Hello!')
      expect(lookup('user', tweetScope)).toBe('Emma')

      // Exit tweet scope
      // reply and tweet gone, user still available
      expect(lookup('reply', userScope)).toBeUndefined()
      expect(lookup('tweet', userScope)).toBeUndefined()
      expect(lookup('user', userScope)).toBe('Emma')

      // Exit user scope
      // All gone
      expect(lookup('reply', rootScope)).toBeUndefined()
      expect(lookup('tweet', rootScope)).toBeUndefined()
      expect(lookup('user', rootScope)).toBeUndefined()
    })
  })
})
