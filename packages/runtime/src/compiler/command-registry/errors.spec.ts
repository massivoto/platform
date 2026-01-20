/**
 * CommandNotFoundError Tests
 *
 * Theme: Social Media Automation
 *
 * Requirements tested:
 * - R-CMD-81 to R-CMD-83: Error Handling
 * - AC-CMD-07: CommandNotFoundError with helpful message
 */
import { describe, it, expect } from 'vitest'
import { CommandNotFoundError } from './errors.js'

describe('CommandNotFoundError', () => {
  describe('R-CMD-81: Error with actionPath property', () => {
    it('should have actionPath property set to provided value', () => {
      const error = new CommandNotFoundError('@twitter/post')

      expect(error.actionPath).toBe('@twitter/post')
    })

    it('should preserve actionPath for different values', () => {
      const error1 = new CommandNotFoundError('@social/schedule')
      const error2 = new CommandNotFoundError('@analytics/report')

      expect(error1.actionPath).toBe('@social/schedule')
      expect(error2.actionPath).toBe('@analytics/report')
    })
  })

  describe('R-CMD-82: LLM-readable error message', () => {
    it('should include action path in message', () => {
      const error = new CommandNotFoundError('@twitter/post')

      expect(error.message).toContain('@twitter/post')
    })

    it('should have descriptive message explaining the error', () => {
      const error = new CommandNotFoundError('@instagram/story')

      // Message should be helpful for LLM understanding
      expect(error.message.length).toBeGreaterThan(20)
      expect(error.message.toLowerCase()).toContain('not found')
    })

    it('should suggest checking available commands', () => {
      const error = new CommandNotFoundError('@facebook/share')

      // Message should guide toward resolution
      expect(error.message.toLowerCase()).toMatch(
        /available|registered|check|valid/i,
      )
    })
  })

  describe('R-CMD-83: Error name for identification', () => {
    it('should have name = CommandNotFoundError', () => {
      const error = new CommandNotFoundError('@social/post')

      expect(error.name).toBe('CommandNotFoundError')
    })

    it('should be instanceof Error', () => {
      const error = new CommandNotFoundError('@social/post')

      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('AC-CMD-07: Helpful message for LLM', () => {
    it('should provide context for debugging', () => {
      const error = new CommandNotFoundError('@twitter/post')

      // The message should be complete enough for an LLM to understand the issue
      expect(error.message).toMatch(/@twitter\/post/)
      expect(error.name).toBe('CommandNotFoundError')
    })
  })

  describe('Error handling patterns', () => {
    it('should be catchable in try-catch', () => {
      let caught: Error | null = null

      try {
        throw new CommandNotFoundError('@linkedin/share')
      } catch (e) {
        caught = e as Error
      }

      expect(caught).toBeInstanceOf(CommandNotFoundError)
      expect((caught as CommandNotFoundError).actionPath).toBe(
        '@linkedin/share',
      )
    })

    it('should work with error type narrowing', () => {
      const error: Error = new CommandNotFoundError('@tiktok/video')

      if (error instanceof CommandNotFoundError) {
        expect(error.actionPath).toBe('@tiktok/video')
      } else {
        throw new Error('Type narrowing failed')
      }
    })
  })
})
