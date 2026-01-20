import { describe, it, expect } from 'vitest'
import {
  InstructionLog,
  createEmptyExecutionContext,
  cloneExecutionContext,
} from './execution-context.js'

/**
 * Test file: execution-context.spec.ts
 * Theme: Social Media Automation (Emma, Carlos, tweet, followers)
 *
 * Tests for InstructionLog changes:
 * - R-LOG-01: cost field
 * - R-LOG-02: output field
 * - R-LOG-03: value field
 * - R-LOG-04: complete execution trace
 */
describe('InstructionLog', () => {
  describe('R-LOG-01: cost field', () => {
    it('should have cost field as number', () => {
      const log: InstructionLog = {
        command: '@utils/set',
        success: true,
        start: '2026-01-20T10:00:00.000Z',
        end: '2026-01-20T10:00:00.005Z',
        duration: 5,
        messages: ['Set user to Emma'],
        cost: 0,
      }

      expect(log.cost).toBe(0)
      expect(typeof log.cost).toBe('number')
    })

    it('should support non-zero cost for paid commands', () => {
      const log: InstructionLog = {
        command: '@ai/generate',
        success: true,
        start: '2026-01-20T10:00:00.000Z',
        end: '2026-01-20T10:00:01.500Z',
        duration: 1500,
        messages: ['Generated tweet for Carlos'],
        cost: 150, // 150 credits for AI generation
      }

      expect(log.cost).toBe(150)
    })
  })

  describe('R-LOG-02: output field', () => {
    it('should have optional output field for variable name', () => {
      const log: InstructionLog = {
        command: '@utils/set',
        success: true,
        start: '2026-01-20T10:00:00.000Z',
        end: '2026-01-20T10:00:00.002Z',
        duration: 2,
        messages: ['Set user'],
        cost: 0,
        output: 'user',
      }

      expect(log.output).toBe('user')
    })

    it('should allow undefined output when not used', () => {
      const log: InstructionLog = {
        command: '@utils/log',
        success: true,
        start: '2026-01-20T10:00:00.000Z',
        end: '2026-01-20T10:00:00.001Z',
        duration: 1,
        messages: ['Logged message'],
        cost: 0,
      }

      expect(log.output).toBeUndefined()
    })
  })

  describe('R-LOG-03: value field', () => {
    it('should capture string value for debugging', () => {
      const log: InstructionLog = {
        command: '@utils/set',
        success: true,
        start: '2026-01-20T10:00:00.000Z',
        end: '2026-01-20T10:00:00.002Z',
        duration: 2,
        messages: ['Set user to Emma'],
        cost: 0,
        output: 'user',
        value: 'Emma',
      }

      expect(log.value).toBe('Emma')
    })

    it('should capture number value for debugging', () => {
      const log: InstructionLog = {
        command: '@utils/set',
        success: true,
        start: '2026-01-20T10:00:00.000Z',
        end: '2026-01-20T10:00:00.002Z',
        duration: 2,
        messages: ['Set followers count'],
        cost: 0,
        output: 'followers',
        value: 1500,
      }

      expect(log.value).toBe(1500)
    })

    it('should capture object value for debugging', () => {
      const tweetData = {
        author: 'Carlos',
        content: 'Hello world!',
        likes: 42,
      }

      const log: InstructionLog = {
        command: '@twitter/post',
        success: true,
        start: '2026-01-20T10:00:00.000Z',
        end: '2026-01-20T10:00:00.500Z',
        duration: 500,
        messages: ['Posted tweet'],
        cost: 10,
        output: 'tweet',
        value: tweetData,
      }

      expect(log.value).toEqual(tweetData)
    })

    it('should allow undefined value when no output', () => {
      const log: InstructionLog = {
        command: '@utils/log',
        success: true,
        start: '2026-01-20T10:00:00.000Z',
        end: '2026-01-20T10:00:00.001Z',
        duration: 1,
        messages: ['Logged: Hello Emma'],
        cost: 0,
      }

      expect(log.value).toBeUndefined()
    })
  })

  describe('R-LOG-04: complete execution trace for LLM debugging', () => {
    it('should capture all fields for successful execution', () => {
      const log: InstructionLog = {
        command: '@utils/set',
        success: true,
        start: '2026-01-20T10:00:00.000Z',
        end: '2026-01-20T10:00:00.005Z',
        duration: 5,
        messages: ['Set user to Emma'],
        cost: 0,
        output: 'user',
        value: 'Emma',
      }

      // All required fields present
      expect(log.command).toBe('@utils/set')
      expect(log.success).toBe(true)
      expect(log.start).toBeDefined()
      expect(log.end).toBeDefined()
      expect(log.duration).toBe(5)
      expect(log.messages).toEqual(['Set user to Emma'])
      expect(log.cost).toBe(0)
      expect(log.output).toBe('user')
      expect(log.value).toBe('Emma')
    })

    it('should capture fatalError for failed execution', () => {
      const log: InstructionLog = {
        command: '@twitter/post',
        success: false,
        fatalError: 'Rate limit exceeded for Carlos',
        start: '2026-01-20T10:00:00.000Z',
        end: '2026-01-20T10:00:00.100Z',
        duration: 100,
        messages: ['API Error: Rate limit exceeded'],
        cost: 0, // No cost charged on failure
      }

      expect(log.success).toBe(false)
      expect(log.fatalError).toBe('Rate limit exceeded for Carlos')
      expect(log.cost).toBe(0)
    })
  })
})

describe('ExecutionContext', () => {
  describe('createEmptyExecutionContext', () => {
    it('should initialize cost.current to 0', () => {
      const context = createEmptyExecutionContext('emma-123')

      expect(context.cost.current).toBe(0)
    })

    it('should initialize empty history array', () => {
      const context = createEmptyExecutionContext('carlos-456')

      expect(context.meta.history).toEqual([])
    })
  })

  describe('cloneExecutionContext', () => {
    it('should preserve cost and history in clone', () => {
      const original = createEmptyExecutionContext('emma-123')
      original.cost.current = 150
      original.meta.history.push({
        command: '@utils/set',
        success: true,
        start: '2026-01-20T10:00:00.000Z',
        end: '2026-01-20T10:00:00.005Z',
        duration: 5,
        messages: ['Set followers'],
        cost: 0,
        output: 'followers',
        value: 1500,
      })

      const cloned = cloneExecutionContext(original)

      expect(cloned.cost.current).toBe(150)
      expect(cloned.meta.history).toHaveLength(1)
      expect(cloned.meta.history[0].output).toBe('followers')
      expect(cloned.meta.history[0].value).toBe(1500)
      expect(cloned.meta.history[0].cost).toBe(0)
    })
  })
})
