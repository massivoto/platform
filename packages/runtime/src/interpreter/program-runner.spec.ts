import { describe, it, expect } from 'vitest'
import { runProgram, ProgramRunError } from './program-runner.js'
import { createEmptyExecutionContext } from './context/core-context'

/**
 * Test file: program-runner.spec.ts
 * Theme: Social Media Automation (Emma, Carlos, tweet, followers)
 *
 * Tests for Program Runner (R-RUN-01 to R-RUN-03)
 */
describe('Program Runner', () => {
  describe('R-RUN-01: runProgram helper', () => {
    it('should parse and execute a simple program', async () => {
      const source = `@utils/set input="Emma" output=user`

      const result = await runProgram(source)

      expect(result.data.user).toBe('Emma')
    })

    it('should parse and execute multi-line program', async () => {
      const source = `
@utils/set input="Emma" output=user
@utils/set input=1500 output=followers
@utils/log message="Setup complete"
      `.trim()

      const result = await runProgram(source)

      expect(result.data.user).toBe('Emma')
      expect(result.data.followers).toBe(1500)
    })

    it('should accept optional context parameter', async () => {
      const context = createEmptyExecutionContext('carlos-456')
      context.data.existingValue = 'Hello'

      const source = `@utils/set input=42 output=count`

      const result = await runProgram(source, context)

      expect(result.data.count).toBe(42)
      expect(result.data.existingValue).toBe('Hello')
      expect(result.user.id).toBe('carlos-456')
    })
  })

  describe('R-RUN-02: returns final ExecutionContext', () => {
    it('should return context with complete history', async () => {
      const source = `
@utils/set input="Emma" output=user
@utils/set input=1500 output=followers
@utils/log message={user}
      `.trim()

      const result = await runProgram(source)

      expect(result.batches[0].actions).toHaveLength(3)
      expect(result.batches[0].actions[0].command).toBe('@utils/set')
      expect(result.batches[0].actions[0].output).toBe('user')
      expect(result.batches[0].actions[0].value).toBe('Emma')
      expect(result.batches[0].actions[1].output).toBe('followers')
      expect(result.batches[0].actions[1].value).toBe(1500)
      expect(result.batches[0].actions[2].command).toBe('@utils/log')
    })

    it('should track cumulative cost', async () => {
      const source = `
@utils/set input="Emma" output=user
@utils/log message="Hello"
      `.trim()

      const result = await runProgram(source)

      // Both @utils/set and @utils/log have cost 0
      expect(result.cost.current).toBe(0)
    })

    it('should have all history entries with cost field', async () => {
      const source = `
@utils/set input="Carlos" output=author
@utils/set input="Hello world!" output=content
      `.trim()

      const result = await runProgram(source)

      for (const log of result.batches[0].actions) {
        expect(typeof log.cost).toBe('number')
      }
    })
  })

  describe('R-RUN-03: throws on parse errors', () => {
    it('should throw ProgramRunError for invalid syntax', async () => {
      const source = `this is not valid DSL`

      await expect(runProgram(source)).rejects.toThrow(ProgramRunError)
    })

    it('should include LLM-readable error message', async () => {
      const source = `@invalid syntax here`

      try {
        await runProgram(source)
        expect.fail('Should have thrown')
      } catch (e) {
        expect(e).toBeInstanceOf(ProgramRunError)
        const error = e as ProgramRunError
        expect(error.message).toContain('Parse error')
        expect(error.source).toBe(source)
      }
    })

    it('should throw for unclosed blocks', async () => {
      const source = `
@block/begin name="Unclosed"
@utils/log message="Inside block"
      `.trim()

      await expect(runProgram(source)).rejects.toThrow(ProgramRunError)
    })

    it('should throw for unknown commands', async () => {
      const source = `@unknown/command arg=value`

      await expect(runProgram(source)).rejects.toThrow(
        'Command not found: @unknown/command',
      )
    })
  })

  describe('Integration scenarios', () => {
    it('should handle variable resolution between instructions', async () => {
      const source = `
@utils/set input="Emma" output=user
@utils/log message={user}
      `.trim()

      const result = await runProgram(source)

      // The log message should have resolved the variable
      expect(result.batches[0].actions[1].messages).toContain('Logged: Emma')
    })

    it('should handle blocks with conditional', async () => {
      const source = `
@utils/set input=true output=shouldRun
@block/begin if={shouldRun}
@utils/set input="Carlos" output=author
@block/end
      `.trim()

      const result = await runProgram(source)

      // Block executed because shouldRun is true
      expect(result.data.author).toBe('Carlos')
    })

    it('should handle empty program', async () => {
      const source = ``

      const result = await runProgram(source)

      expect(result.batches[0].actions).toHaveLength(0)
    })

    it('should handle program with only whitespace', async () => {
      const source = `


      `

      const result = await runProgram(source)

      expect(result.batches[0].actions).toHaveLength(0)
    })

    it('PRD example: social media automation', async () => {
      const source = `
@utils/set input="Emma" output=user
@utils/set input=1500 output=followers
@utils/log message={user}
      `.trim()

      const result = await runProgram(source)

      expect(result.data.user).toBe('Emma')
      expect(result.data.followers).toBe(1500)
      expect(result.batches[0].actions).toHaveLength(3)
      expect(result.batches[0].actions[0].output).toBe('user')
      expect(result.batches[0].actions[0].value).toBe('Emma')
      expect(result.cost.current).toBe(0)
    })
  })
})
