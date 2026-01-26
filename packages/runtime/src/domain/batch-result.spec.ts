import { describe, it, expect } from 'vitest'
import type { BatchResult } from './batch-result.js'
import type { ActionLog } from './action-log.js'

/**
 * Test file: batch-result.spec.ts
 * Theme: Social Media Automation (Emma, Carlos, tweet, followers)
 *
 * Tests for BatchResult interface (R-TERM-02)
 * BatchResult aggregates ActionLogs for blocks, templates, or any grouping.
 */
describe('BatchResult', () => {
  describe('R-TERM-02: BatchResult interface structure', () => {
    it('should aggregate successful actions', () => {
      const actions: ActionLog[] = [
        {
          command: '@utils/set',
          success: true,
          start: '2026-01-20T10:00:00.000Z',
          end: '2026-01-20T10:00:00.005Z',
          duration: 5,
          messages: ['Set user to Emma'],
          cost: 0,
          output: 'user',
          value: 'Emma',
        },
        {
          command: '@utils/set',
          success: true,
          start: '2026-01-20T10:00:00.006Z',
          end: '2026-01-20T10:00:00.010Z',
          duration: 4,
          messages: ['Set followers to 1500'],
          cost: 0,
          output: 'followers',
          value: 1500,
        },
      ]

      const batch: BatchResult = {
        success: true,
        message: "Block 'init' completed",
        actions,
        totalCost: 0,
        duration: 9,
      }

      expect(batch.success).toBe(true)
      expect(batch.message).toBe("Block 'init' completed")
      expect(batch.actions).toHaveLength(2)
      expect(batch.totalCost).toBe(0)
      expect(batch.duration).toBe(9)
    })

    it('should handle batch with failed action', () => {
      const actions: ActionLog[] = [
        {
          command: '@utils/set',
          success: true,
          start: '2026-01-20T10:00:00.000Z',
          end: '2026-01-20T10:00:00.005Z',
          duration: 5,
          messages: ['Set user to Carlos'],
          cost: 0,
          output: 'user',
          value: 'Carlos',
        },
        {
          command: '@twitter/post',
          success: false,
          fatalError: 'Rate limit exceeded',
          start: '2026-01-20T10:00:00.006Z',
          end: '2026-01-20T10:00:00.106Z',
          duration: 100,
          messages: ['API Error: Rate limit exceeded'],
          cost: 0,
        },
      ]

      const batch: BatchResult = {
        success: false,
        message: "Block 'tweet' failed: Rate limit exceeded",
        actions,
        totalCost: 0,
        duration: 105,
      }

      expect(batch.success).toBe(false)
      expect(batch.message).toContain('failed')
      expect(batch.actions).toHaveLength(2)
    })

    it('should track totalCost across actions', () => {
      const actions: ActionLog[] = [
        {
          command: '@ai/generate',
          success: true,
          start: '2026-01-20T10:00:00.000Z',
          end: '2026-01-20T10:00:01.000Z',
          duration: 1000,
          messages: ['Generated bio for Emma'],
          cost: 100,
          output: 'bio',
          value: 'Emma is a social media expert...',
        },
        {
          command: '@ai/summarize',
          success: true,
          start: '2026-01-20T10:00:01.001Z',
          end: '2026-01-20T10:00:01.500Z',
          duration: 499,
          messages: ['Summarized tweets'],
          cost: 50,
          output: 'summary',
          value: 'Top trending topics...',
        },
      ]

      const batch: BatchResult = {
        success: true,
        message: "Block 'ai-processing' completed",
        actions,
        totalCost: 150,
        duration: 1499,
      }

      expect(batch.totalCost).toBe(150)
    })

    it('should handle empty batch (forEach with empty collection)', () => {
      const batch: BatchResult = {
        success: true,
        message: 'ForEach completed (0 iterations)',
        actions: [],
        totalCost: 0,
        duration: 0,
      }

      expect(batch.success).toBe(true)
      expect(batch.actions).toHaveLength(0)
      expect(batch.totalCost).toBe(0)
    })

    it('should describe batch purpose in message', () => {
      const batch: BatchResult = {
        success: true,
        message: "Template 'user-profile' completed",
        actions: [
          {
            command: '@utils/set',
            success: true,
            start: '2026-01-20T10:00:00.000Z',
            end: '2026-01-20T10:00:00.002Z',
            duration: 2,
            messages: [],
            cost: 0,
          },
        ],
        totalCost: 0,
        duration: 2,
      }

      expect(batch.message).toContain('Template')
      expect(batch.message).toContain('user-profile')
    })
  })
})
