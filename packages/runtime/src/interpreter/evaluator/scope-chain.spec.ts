import { describe, it, expect } from 'vitest'
import {
  ScopeChain,
  createEmptyScopeChain,
  pushScope,
  popScope,
  lookup,
  write,
  cloneScopeChain,
} from './scope-chain.js'

/**
 * Test file: scope-chain.spec.ts
 * Theme: Social Media Automation (Emma, Carlos, tweet, followers)
 *
 * Tests for Nested Scope Chain (R-SCOPE-101 to R-SCOPE-104)
 */
describe('ScopeChain', () => {
  describe('R-SCOPE-101: ScopeChain type', () => {
    it('should have current property as Record<string, any>', () => {
      const chain: ScopeChain = { current: {} }
      expect(chain.current).toEqual({})
    })

    it('should have optional parent property', () => {
      const parent: ScopeChain = { current: { user: 'Emma' } }
      const child: ScopeChain = { current: { tweet: 'Hello world!' }, parent }

      expect(child.parent).toBe(parent)
      expect(child.parent?.current.user).toBe('Emma')
    })

    it('should allow nested parent chains', () => {
      const root: ScopeChain = { current: { level: 'root' } }
      const middle: ScopeChain = { current: { level: 'middle' }, parent: root }
      const leaf: ScopeChain = { current: { level: 'leaf' }, parent: middle }

      expect(leaf.current.level).toBe('leaf')
      expect(leaf.parent?.current.level).toBe('middle')
      expect(leaf.parent?.parent?.current.level).toBe('root')
      expect(leaf.parent?.parent?.parent).toBeUndefined()
    })
  })

  describe('R-SCOPE-102: pushScope()', () => {
    it('should create child scope with current as parent', () => {
      const parent = createEmptyScopeChain()
      parent.current.user = 'Emma'

      const child = pushScope(parent)

      expect(child.parent).toBe(parent)
      expect(child.current).toEqual({})
      expect(child.parent?.current.user).toBe('Emma')
    })

    it('should allow multiple levels of nesting', () => {
      const level0 = createEmptyScopeChain()
      level0.current.users = ['Emma', 'Carlos']

      const level1 = pushScope(level0)
      level1.current.user = 'Emma'

      const level2 = pushScope(level1)
      level2.current.tweet = 'Hello world!'

      expect(level2.parent).toBe(level1)
      expect(level2.parent?.parent).toBe(level0)
      expect(level2.current.tweet).toBe('Hello world!')
    })

    it('should create independent child scope', () => {
      const parent = createEmptyScopeChain()
      parent.current.followers = 1500

      const child = pushScope(parent)
      child.current.followers = 5000 // Shadow parent's followers

      expect(child.current.followers).toBe(5000)
      expect(parent.current.followers).toBe(1500) // Parent unchanged
    })
  })

  describe('R-SCOPE-103: popScope()', () => {
    it('should return to parent scope', () => {
      const parent = createEmptyScopeChain()
      parent.current.user = 'Emma'

      const child = pushScope(parent)
      child.current.tweet = 'Hello world!'

      const popped = popScope(child)

      expect(popped).toBe(parent)
      expect(popped.current.user).toBe('Emma')
      expect(popped.current.tweet).toBeUndefined()
    })

    it('should discard current scope data', () => {
      const parent = createEmptyScopeChain()
      const child = pushScope(parent)
      child.current.temporaryData = 'Should be gone'

      const popped = popScope(child)

      expect(popped.current.temporaryData).toBeUndefined()
    })

    it('should throw error when popping root scope', () => {
      const root = createEmptyScopeChain()

      expect(() => popScope(root)).toThrow('Cannot pop root scope')
    })

    it('should allow popping multiple levels', () => {
      const level0 = createEmptyScopeChain()
      level0.current.level = 'root'

      const level1 = pushScope(level0)
      level1.current.level = 'one'

      const level2 = pushScope(level1)
      level2.current.level = 'two'

      const poppedOnce = popScope(level2)
      expect(poppedOnce.current.level).toBe('one')

      const poppedTwice = popScope(poppedOnce)
      expect(poppedTwice.current.level).toBe('root')
    })
  })

  describe('R-SCOPE-104: lookup()', () => {
    it('should find value in current scope', () => {
      const chain = createEmptyScopeChain()
      chain.current.user = 'Emma'

      expect(lookup('user', chain)).toBe('Emma')
    })

    it('should find value in parent scope', () => {
      const parent = createEmptyScopeChain()
      parent.current.user = 'Carlos'

      const child = pushScope(parent)
      child.current.tweet = 'Hello!'

      expect(lookup('user', child)).toBe('Carlos')
      expect(lookup('tweet', child)).toBe('Hello!')
    })

    it('should walk chain from current to root', () => {
      const root = createEmptyScopeChain()
      root.current.globalUser = 'Admin'

      const level1 = pushScope(root)
      level1.current.user = 'Emma'

      const level2 = pushScope(level1)
      level2.current.tweet = 'Hello world!'

      // From deepest scope, can find all ancestors
      expect(lookup('tweet', level2)).toBe('Hello world!')
      expect(lookup('user', level2)).toBe('Emma')
      expect(lookup('globalUser', level2)).toBe('Admin')
    })

    it('should return first match (current scope wins)', () => {
      const parent = createEmptyScopeChain()
      parent.current.user = 'Emma'

      const child = pushScope(parent)
      child.current.user = 'Carlos' // Shadow parent

      expect(lookup('user', child)).toBe('Carlos')
      expect(lookup('user', parent)).toBe('Emma')
    })

    it('should return undefined for missing key', () => {
      const chain = createEmptyScopeChain()
      chain.current.user = 'Emma'

      expect(lookup('nonexistent', chain)).toBeUndefined()
    })

    it('should return undefined when searching through entire chain', () => {
      const parent = createEmptyScopeChain()
      parent.current.user = 'Emma'

      const child = pushScope(parent)
      child.current.tweet = 'Hello!'

      expect(lookup('followers', child)).toBeUndefined()
    })

    it('should handle falsy values correctly', () => {
      const chain = createEmptyScopeChain()
      chain.current.count = 0
      chain.current.empty = ''
      chain.current.flag = false
      chain.current.nothing = null

      expect(lookup('count', chain)).toBe(0)
      expect(lookup('empty', chain)).toBe('')
      expect(lookup('flag', chain)).toBe(false)
      expect(lookup('nothing', chain)).toBe(null)
    })
  })

  describe('write()', () => {
    it('should write to current scope only', () => {
      const parent = createEmptyScopeChain()
      parent.current.user = 'Emma'

      const child = pushScope(parent)
      write('user', 'Carlos', child)

      // Child has new value
      expect(child.current.user).toBe('Carlos')
      // Parent unchanged
      expect(parent.current.user).toBe('Emma')
    })

    it('should create new key in current scope', () => {
      const chain = createEmptyScopeChain()
      write('tweet', 'Hello world!', chain)

      expect(chain.current.tweet).toBe('Hello world!')
    })

    it('should not walk up the chain when writing', () => {
      const parent = createEmptyScopeChain()
      parent.current.followers = 1000

      const child = pushScope(parent)
      // Writing 'followers' should NOT update parent
      write('followers', 5000, child)

      expect(child.current.followers).toBe(5000)
      expect(parent.current.followers).toBe(1000)
    })
  })

  describe('createEmptyScopeChain()', () => {
    it('should create scope with empty current object', () => {
      const chain = createEmptyScopeChain()

      expect(chain.current).toEqual({})
    })

    it('should create scope with no parent', () => {
      const chain = createEmptyScopeChain()

      expect(chain.parent).toBeUndefined()
    })
  })

  describe('cloneScopeChain()', () => {
    it('should deep clone the entire chain', () => {
      const root = createEmptyScopeChain()
      root.current.user = 'Emma'

      const child = pushScope(root)
      child.current.tweet = 'Hello!'

      const cloned = cloneScopeChain(child)

      // Different objects
      expect(cloned).not.toBe(child)
      expect(cloned.current).not.toBe(child.current)
      expect(cloned.parent).not.toBe(child.parent)

      // Same values
      expect(cloned.current.tweet).toBe('Hello!')
      expect(cloned.parent?.current.user).toBe('Emma')
    })

    it('should allow independent modification after clone', () => {
      const original = createEmptyScopeChain()
      original.current.followers = 1500

      const cloned = cloneScopeChain(original)
      cloned.current.followers = 5000

      expect(original.current.followers).toBe(1500)
      expect(cloned.current.followers).toBe(5000)
    })

    it('should handle deeply nested chains', () => {
      const level0 = createEmptyScopeChain()
      level0.current.a = 1

      const level1 = pushScope(level0)
      level1.current.b = 2

      const level2 = pushScope(level1)
      level2.current.c = 3

      const cloned = cloneScopeChain(level2)

      expect(cloned.current.c).toBe(3)
      expect(cloned.parent?.current.b).toBe(2)
      expect(cloned.parent?.parent?.current.a).toBe(1)
    })
  })

  describe('Integration: Nested forEach simulation', () => {
    it('should simulate outer forEach with user, inner forEach with tweet', () => {
      // Simulate: forEach users -> forEach tweets
      const users = [
        { name: 'Emma', tweets: ['Hello!', 'World!'] },
        { name: 'Carlos', tweets: ['Hola!'] },
      ]

      let rootScope = createEmptyScopeChain()
      const results: string[] = []

      // Outer loop
      for (const user of users) {
        // Push scope for outer forEach (user)
        let userScope = pushScope(rootScope)
        write('user', user, userScope)

        // Inner loop
        for (const tweet of user.tweets) {
          // Push scope for inner forEach (tweet)
          let tweetScope = pushScope(userScope)
          write('tweet', tweet, tweetScope)

          // Inside inner loop: both user and tweet resolvable
          const resolvedUser = lookup('user', tweetScope) as {
            name: string
            tweets: string[]
          }
          const resolvedTweet = lookup('tweet', tweetScope)
          results.push(`${resolvedUser.name}: ${resolvedTweet}`)

          // Pop tweet scope (implicit at end of inner forEach iteration)
          tweetScope = popScope(tweetScope)
        }

        // After inner loop: tweet should be gone, user still available
        expect(lookup('user', userScope)).toBe(user)
        expect(lookup('tweet', userScope)).toBeUndefined()

        // Pop user scope
        userScope = popScope(userScope)
      }

      expect(results).toEqual(['Emma: Hello!', 'Emma: World!', 'Carlos: Hola!'])
    })

    it('should handle shadowing in nested forEach', () => {
      // Outer forEach with item="item", inner forEach shadows with item="item"
      const rootScope = createEmptyScopeChain()

      const outerScope = pushScope(rootScope)
      write('item', 'outer-value', outerScope)
      expect(lookup('item', outerScope)).toBe('outer-value')

      const innerScope = pushScope(outerScope)
      write('item', 'inner-value', innerScope)
      expect(lookup('item', innerScope)).toBe('inner-value')
      expect(lookup('item', outerScope)).toBe('outer-value') // Still outer

      // Pop inner scope
      const afterInner = popScope(innerScope)
      expect(lookup('item', afterInner)).toBe('outer-value') // Restored
    })

    it('should handle 3-level nesting (user -> tweet -> reply)', () => {
      // AC-SCOPE-14: Given 3-level nesting (user -> tweet -> reply),
      // when innermost runs, then all three variables are resolvable via chain walk

      const rootScope = createEmptyScopeChain()

      const userScope = pushScope(rootScope)
      write('user', 'Emma', userScope)

      const tweetScope = pushScope(userScope)
      write('tweet', 'Hello world!', tweetScope)

      const replyScope = pushScope(tweetScope)
      write('reply', 'Great tweet!', replyScope)

      // All three resolvable from innermost scope
      expect(lookup('reply', replyScope)).toBe('Great tweet!')
      expect(lookup('tweet', replyScope)).toBe('Hello world!')
      expect(lookup('user', replyScope)).toBe('Emma')

      // Pop reply scope
      const afterReply = popScope(replyScope)
      expect(lookup('reply', afterReply)).toBeUndefined()
      expect(lookup('tweet', afterReply)).toBe('Hello world!')
      expect(lookup('user', afterReply)).toBe('Emma')
    })
  })
})
