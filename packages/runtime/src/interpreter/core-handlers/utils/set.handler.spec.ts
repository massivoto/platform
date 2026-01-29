import { describe, it, expect } from 'vitest'
import { SetHandler } from './set.handler.js'

/**
 * Test file: set.handler.spec.ts
 * Theme: Social Media Automation (Emma, Carlos, tweet, followers)
 *
 * Tests for SetHandler (R-HAND-02, R-HAND-03, R-HAND-04)
 */
describe('SetHandler', () => {
  describe('R-HAND-02: implements full CommandHandler interface', () => {
    it('should have id property set to @utils/set', () => {
      const handler = new SetHandler()

      expect(handler.id).toBe('@utils/set')
    })

    it('should have type property set to command', () => {
      const handler = new SetHandler()

      expect(handler.type).toBe('command')
    })
  })

  describe('R-HAND-03: init() and dispose() methods', () => {
    it('should have init() method', async () => {
      const handler = new SetHandler()

      await expect(handler.init()).resolves.toBeUndefined()
    })

    it('should have dispose() method', async () => {
      const handler = new SetHandler()

      await expect(handler.dispose()).resolves.toBeUndefined()
    })
  })

  describe('R-HAND-04: returns cost: 0', () => {
    it('should return cost 0 on success', async () => {
      const handler = new SetHandler()
      const context = createEmptyExecutionContext('emma-123')

      const result = await handler.run({ input: 'Emma' }, context)

      expect(result.cost).toBe(0)
    })

    it('should return cost 0 on failure', async () => {
      const handler = new SetHandler()
      const context = createEmptyExecutionContext('carlos-456')

      const result = await handler.run({}, context)

      expect(result.cost).toBe(0)
    })
  })

  describe('run() behavior', () => {
    it('should succeed with string input', async () => {
      const handler = new SetHandler()
      const context = createEmptyExecutionContext('emma-123')

      const result = await handler.run({ input: 'Emma' }, context)

      expect(result.success).toBe(true)
      expect(result.value).toBe('Emma')
    })

    it('should succeed with number input', async () => {
      const handler = new SetHandler()
      const context = createEmptyExecutionContext('carlos-456')

      const result = await handler.run({ input: 1500 }, context)

      expect(result.success).toBe(true)
      expect(result.value).toBe(1500)
    })

    it('should succeed with object input', async () => {
      const handler = new SetHandler()
      const context = createEmptyExecutionContext('emma-123')
      const tweet = { author: 'Carlos', content: 'Hello world!', likes: 42 }

      const result = await handler.run({ input: tweet }, context)

      expect(result.success).toBe(true)
      expect(result.value).toEqual(tweet)
    })

    it('should succeed with array input', async () => {
      const handler = new SetHandler()
      const context = createEmptyExecutionContext('emma-123')
      const followers = ['Carlos', 'Diana', 'Alex']

      const result = await handler.run({ input: followers }, context)

      expect(result.success).toBe(true)
      expect(result.value).toEqual(followers)
    })

    it('should succeed with boolean input', async () => {
      const handler = new SetHandler()
      const context = createEmptyExecutionContext('emma-123')

      const result = await handler.run({ input: true }, context)

      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })

    it('should succeed with null input', async () => {
      const handler = new SetHandler()
      const context = createEmptyExecutionContext('emma-123')

      const result = await handler.run({ input: null }, context)

      expect(result.success).toBe(true)
      expect(result.value).toBe(null)
    })

    it('should fail when input is missing', async () => {
      const handler = new SetHandler()
      const context = createEmptyExecutionContext('emma-123')

      const result = await handler.run({}, context)

      expect(result.success).toBe(false)
      expect(result.fatalError).toBe('Input is required')
    })

    it('should fail when input is undefined', async () => {
      const handler = new SetHandler()
      const context = createEmptyExecutionContext('emma-123')

      const result = await handler.run({ input: undefined }, context)

      expect(result.success).toBe(false)
      expect(result.fatalError).toBe('Input is required')
    })
  })
})
