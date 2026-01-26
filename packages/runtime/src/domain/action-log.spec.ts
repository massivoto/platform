import { describe, it, expect } from 'vitest'
import type { ActionLog } from './action-log.js'

/**
 * Test file: action-log.spec.ts
 * Theme: Social Media Automation (Emma, Carlos, tweet, followers)
 *
 * Tests for ActionLog interface (R-TERM-01)
 * ActionLog replaces InstructionLog with marketing-friendly terminology.
 */
describe('ActionLog', () => {
  describe('R-TERM-01: ActionLog interface structure', () => {
    it('should have all required fields for successful action', () => {
      const log: ActionLog = {
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

    it('should support fatalError for failed actions', () => {
      const log: ActionLog = {
        command: '@twitter/post',
        success: false,
        fatalError: 'Rate limit exceeded for Carlos',
        start: '2026-01-20T10:00:00.000Z',
        end: '2026-01-20T10:00:00.100Z',
        duration: 100,
        messages: ['API Error: Rate limit exceeded'],
        cost: 0,
      }

      expect(log.success).toBe(false)
      expect(log.fatalError).toBe('Rate limit exceeded for Carlos')
    })

    it('should support non-zero cost for paid actions', () => {
      const log: ActionLog = {
        command: '@ai/generate',
        success: true,
        start: '2026-01-20T10:00:00.000Z',
        end: '2026-01-20T10:00:01.500Z',
        duration: 1500,
        messages: ['Generated tweet for Carlos'],
        cost: 150,
      }

      expect(log.cost).toBe(150)
    })

    it('should allow optional output and value fields', () => {
      const log: ActionLog = {
        command: '@utils/log',
        success: true,
        start: '2026-01-20T10:00:00.000Z',
        end: '2026-01-20T10:00:00.001Z',
        duration: 1,
        messages: ['Logged: Hello Emma'],
        cost: 0,
      }

      expect(log.output).toBeUndefined()
      expect(log.value).toBeUndefined()
    })

    it('should capture object values for debugging', () => {
      const tweetData = {
        author: 'Carlos',
        content: 'Hello world!',
        likes: 42,
      }

      const log: ActionLog = {
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
  })
})
