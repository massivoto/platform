import { describe, it, expect } from 'vitest'
import { LogHandler } from './log.handler.js'
import {
  createEmptyExecutionContext,
  fromPartialContext,
} from '../../../domain/execution-context.js'

/**
 * Test file: log.handler.spec.ts
 * Theme: Social Media Automation (Emma, Carlos, tweet, followers)
 *
 * Tests for LogHandler (R-HAND-01, R-HAND-03, R-HAND-04)
 */
describe('LogHandler', () => {
  describe('R-HAND-01: implements full CommandHandler interface', () => {
    it('should have id property set to @utils/log', () => {
      const handler = new LogHandler()

      expect(handler.id).toBe('@utils/log')
    })

    it('should have type property set to command', () => {
      const handler = new LogHandler()

      expect(handler.type).toBe('command')
    })
  })

  describe('R-HAND-03: init() and dispose() methods', () => {
    it('should have init() method', async () => {
      const handler = new LogHandler()

      await expect(handler.init()).resolves.toBeUndefined()
    })

    it('should have dispose() method', async () => {
      const handler = new LogHandler()

      await expect(handler.dispose()).resolves.toBeUndefined()
    })
  })

  describe('R-HAND-04: returns cost: 0', () => {
    it('should return cost 0 on success', async () => {
      const handler = new LogHandler()
      const context = createEmptyExecutionContext('emma-123')

      const result = await handler.run({ message: 'Hello Emma' }, context)

      expect(result.cost).toBe(0)
    })

    it('should return cost 0 on failure', async () => {
      const handler = new LogHandler()
      const context = createEmptyExecutionContext('carlos-456')

      const result = await handler.run({}, context)

      expect(result.cost).toBe(0)
    })
  })

  describe('run() behavior', () => {
    it('should succeed with valid message', async () => {
      const handler = new LogHandler()
      const context = createEmptyExecutionContext('emma-123')

      const result = await handler.run(
        { message: 'Tweet posted by Carlos' },
        context,
      )

      expect(result.success).toBe(true)
      expect(result.messages).toContain('Logged: Tweet posted by Carlos')
    })

    it('should fail when message is missing', async () => {
      const handler = new LogHandler()
      const context = createEmptyExecutionContext('emma-123')

      const result = await handler.run({}, context)

      expect(result.success).toBe(false)
      expect(result.fatalError).toBe('Message is required')
    })

    it('should fail when message is undefined', async () => {
      const handler = new LogHandler()
      const context = createEmptyExecutionContext('emma-123')

      const result = await handler.run({ message: undefined }, context)

      expect(result.success).toBe(false)
      expect(result.fatalError).toBe('Message is required')
    })

    it('should handle numeric message by coercing to string', async () => {
      const handler = new LogHandler()
      const context = createEmptyExecutionContext('emma-123')

      const result = await handler.run({ message: 1500 }, context)

      expect(result.success).toBe(true)
      expect(result.messages).toContain('Logged: 1500')
    })
  })

  /**
   * R-CONFIRM-124: Log handler appends to context.userLogs
   */
  describe('R-CONFIRM-124: userLogs integration', () => {
    it('should append message to context.userLogs', async () => {
      const handler = new LogHandler()
      const context = createEmptyExecutionContext('emma-123')

      await handler.run({ message: 'Tweet posted by Emma' }, context)

      expect(context.userLogs).toContain('Tweet posted by Emma')
    })

    it('should append multiple messages in order', async () => {
      const handler = new LogHandler()
      const context = createEmptyExecutionContext('emma-123')

      await handler.run({ message: 'First message' }, context)
      await handler.run({ message: 'Second message' }, context)

      expect(context.userLogs).toEqual(['First message', 'Second message'])
    })

    it('should preserve existing userLogs entries', async () => {
      const handler = new LogHandler()
      const context = fromPartialContext({
        userLogs: ['Previous log entry'],
        user: { id: 'emma-123', extra: {} },
      })

      await handler.run({ message: 'New log entry' }, context)

      expect(context.userLogs).toEqual(['Previous log entry', 'New log entry'])
    })

    it('should coerce non-string messages before appending', async () => {
      const handler = new LogHandler()
      const context = createEmptyExecutionContext('emma-123')

      await handler.run({ message: 1500 }, context)

      expect(context.userLogs).toContain('1500')
    })

    it('should not append to userLogs when message is missing', async () => {
      const handler = new LogHandler()
      const context = createEmptyExecutionContext('emma-123')

      await handler.run({}, context)

      expect(context.userLogs).toHaveLength(0)
    })
  })
})
