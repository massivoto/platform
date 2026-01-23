import { describe, it, expect } from 'vitest'
import { runProgram } from './program-runner.js'
import { createEmptyExecutionContext } from '../../domain/execution-context.js'
import type { ProgramResult } from '../../domain/program-result.js'

describe('ProgramResult', () => {
  describe('R-GOTO-82: runProgram returns ProgramResult', () => {
    it('returns ProgramResult with context, exitCode, and exitedEarly fields', async () => {
      const source = `
        @utils/set input="Emma" output=user
      `
      const result = await runProgram(source)

      // Should be a ProgramResult, not ExecutionContext
      expect(result).toHaveProperty('context')
      expect(result).toHaveProperty('exitCode')
      expect(result).toHaveProperty('exitedEarly')
      expect(result.context.data.user).toBe('Emma')
    })
  })

  describe('R-GOTO-83: Normal completion yields exitCode=0, exitedEarly=false', () => {
    it('AC-GOTO-07: program without @flow/exit has exitCode=0 and exitedEarly=false', async () => {
      const source = `
        @utils/set input=100 output=total
        @utils/set input="done" output=status
      `
      const result = await runProgram(source)

      expect(result.exitCode).toBe(0)
      expect(result.exitedEarly).toBe(false)
      expect(result.value).toBeUndefined()
      expect(result.context.data.total).toBe(100)
      expect(result.context.data.status).toBe('done')
    })

    it('empty program has exitCode=0 and exitedEarly=false', async () => {
      const source = ``
      const result = await runProgram(source)

      expect(result.exitCode).toBe(0)
      expect(result.exitedEarly).toBe(false)
      expect(result.value).toBeUndefined()
    })
  })

  describe('R-GOTO-84: @flow/exit sets exitCode and exitedEarly=true', () => {
    it('AC-GOTO-06: @flow/exit code=1 yields exitCode=1 and exitedEarly=true', async () => {
      const source = `
        @utils/set input="error detected" output=message
        @flow/exit code=1
        @utils/set input="never reached" output=message
      `
      const result = await runProgram(source)

      expect(result.exitCode).toBe(1)
      expect(result.exitedEarly).toBe(true)
      expect(result.exitedAt).toBeDefined()
      expect(result.context.data.message).toBe('error detected')
    })

    it('@flow/exit with default code=0', async () => {
      const source = `
        @utils/set input="early exit" output=status
        @flow/exit
      `
      const result = await runProgram(source)

      expect(result.exitCode).toBe(0)
      expect(result.exitedEarly).toBe(true)
      expect(result.context.data.status).toBe('early exit')
    })

    it('@flow/exit code=42 yields exitCode=42', async () => {
      const source = `
        @flow/exit code=42
      `
      const result = await runProgram(source)

      expect(result.exitCode).toBe(42)
      expect(result.exitedEarly).toBe(true)
    })
  })

  describe('R-GOTO-85: @flow/return sets value and exitCode=0', () => {
    it('AC-GOTO-08: @flow/return value={total * 1.2} with total=100 yields value=120', async () => {
      const source = `
        @utils/set input=100 output=total
        @flow/return value={total * 1.2}
      `
      const result = await runProgram(source)

      expect(result.value).toBe(120)
      expect(result.exitCode).toBe(0)
      expect(result.exitedEarly).toBe(true)
    })

    it('@flow/return value="success" yields string value', async () => {
      const source = `
        @flow/return value="success"
      `
      const result = await runProgram(source)

      expect(result.value).toBe('success')
      expect(result.exitCode).toBe(0)
      expect(result.exitedEarly).toBe(true)
    })

    it('@flow/return with complex expression', async () => {
      const source = `
        @utils/set input=10 output=price
        @utils/set input=0.2 output=discount
        @flow/return value={price * (1 - discount)}
      `
      const result = await runProgram(source)

      expect(result.value).toBe(8)
      expect(result.exitCode).toBe(0)
      expect(result.exitedEarly).toBe(true)
    })

    it('@flow/return stops execution', async () => {
      const source = `
        @utils/set input="before" output=status
        @flow/return value=42
        @utils/set input="after" output=status
      `
      const result = await runProgram(source)

      expect(result.value).toBe(42)
      expect(result.context.data.status).toBe('before')
    })
  })

  describe('ProgramResult preserves context', () => {
    it('result.context contains complete history', async () => {
      const source = `
        @utils/set input=1 output=a
        @utils/set input=2 output=b
      `
      const result = await runProgram(source)

      expect(result.history.length).toBe(2)
      expect(result.history[0].command).toBe('@utils/set')
      expect(result.history[1].command).toBe('@utils/set')
    })

    it('result.context.data contains all variables', async () => {
      const source = `
        @utils/set input="Alice" output=user
        @utils/set input=42 output=count
      `
      const result = await runProgram(source)

      expect(result.context.data.user).toBe('Alice')
      expect(result.context.data.count).toBe(42)
    })

    it('exitedAt indicates instruction index where exit occurred', async () => {
      const source = `
        @utils/set input=1 output=a
        @flow/exit code=5
        @utils/set input=2 output=b
      `
      const result = await runProgram(source)

      expect(result.exitedAt).toBe(1) // 0-indexed, @flow/exit is at index 1
    })
  })
})
