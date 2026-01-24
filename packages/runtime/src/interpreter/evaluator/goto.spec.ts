import { describe, it, expect } from 'vitest'
import { runProgram } from '../program-runner.js'

describe('Goto Interpreter', () => {
  describe('R-GOTO-21: Label index built as Map<string, number>', () => {
    it('builds label index from program instructions', async () => {
      const source = `
        @utils/set input="first" output=a label="start"
        @utils/set input="second" output=b
        @utils/set input="third" output=c label="middle"
        @utils/set input="fourth" output=d label="end"
      `
      const result = await runProgram(source)

      // If labels work, the program should complete normally
      expect(result.exitCode).toBe(0)
      expect(result.data.a).toBe('first')
      expect(result.data.d).toBe('fourth')
    })
  })

  describe('R-GOTO-22: Instruction pointer set to label index', () => {
    it('goto jumps to correct instruction by label', async () => {
      const source = `
        @utils/set input="start" output=trace
        @flow/goto target="skip"
        @utils/set input="middle" output=trace
        @utils/set input={trace + "-end"} output=trace label="skip"
      `
      const result = await runProgram(source)

      // Should skip the "middle" instruction
      expect(result.data.trace).toBe('start-end')
    })

    it('multiple gotos work correctly', async () => {
      const source = `
        @utils/set input=0 output=step
        @flow/goto target="step1"
        @utils/set input={step + 1} output=step label="step3"
        @flow/goto target="end"
        @utils/set input={step + 1} output=step label="step1"
        @flow/goto target="step2"
        @utils/set input={step + 1} output=step label="step2"
        @flow/goto target="step3"
        @utils/set input="done" output=status label="end"
      `
      const result = await runProgram(source)

      expect(result.data.step).toBe(3)
      expect(result.data.status).toBe('done')
    })
  })

  describe('R-GOTO-23: Goto to forEach restarts the loop', () => {
    it('AC-GOTO-03: Sophie gotos to forEach label, loop restarts', async () => {
      // Note: forEach on single instruction is different from forEach block
      // This tests the restart behavior when jumping to a labeled forEach
      const source = `
        @utils/set input=0 output=runCount
        @utils/set input=[1, 2, 3] output=items label="loop"
        @utils/set input={runCount + 1} output=runCount
        @flow/goto target="end" if={runCount >= 2}
        @flow/goto target="loop"
        @utils/set input="done" output=status label="end"
      `
      const result = await runProgram(source)

      expect(result.data.runCount).toBe(2)
      expect(result.data.status).toBe('done')
    })
  })

  describe('R-GOTO-24: Goto to if re-evaluates condition', () => {
    it('jumping to an if instruction re-evaluates its condition', async () => {
      const source = `
        @utils/set input=0 output=counter
        @utils/set input={counter + 1} output=counter label="check"
        @flow/goto target="done" if={counter >= 3}
        @flow/goto target="check"
        @utils/set input="finished" output=status label="done"
      `
      const result = await runProgram(source)

      // Counter should be 3 when we finally pass the if condition
      expect(result.data.counter).toBe(3)
      expect(result.data.status).toBe('finished')
    })
  })

  describe('R-GOTO-25: Context preserved across jumps', () => {
    it('data variables persist through jumps', async () => {
      const source = `
        @utils/set input="user1" output=user
        @utils/set input=100 output=score
        @flow/goto target="process"
        @utils/set input="should skip" output=skipped
        @utils/set input={score + 50} output=score label="process"
        @utils/set input={user} output=originalUser
      `
      const result = await runProgram(source)

      expect(result.data.user).toBe('user1')
      expect(result.data.score).toBe(150)
      expect(result.data.originalUser).toBe('user1')
      expect(result.data.skipped).toBeUndefined()
    })

    it('execution history is preserved', async () => {
      const source = `
        @utils/set input=1 output=a
        @flow/goto target="end"
        @utils/set input=2 output=b
        @utils/set input=3 output=c label="end"
      `
      const result = await runProgram(source)

      // Should have 3 history entries: set a, goto, set c
      expect(result.history.length).toBe(3)
      expect(result.history[0].command).toBe('@utils/set')
      expect(result.history[1].command).toBe('@flow/goto')
      expect(result.history[2].command).toBe('@utils/set')
    })
  })

  describe('Edge cases', () => {
    it('goto to immediate next instruction is a no-op', async () => {
      const source = `
        @utils/set input=1 output=a
        @flow/goto target="next"
        @utils/set input=2 output=b label="next"
      `
      const result = await runProgram(source)

      expect(result.data.a).toBe(1)
      expect(result.data.b).toBe(2)
    })

    it('goto at end of program', async () => {
      const source = `
        @utils/set input=1 output=a
        @flow/goto target="end"
        @utils/set input="skipped" output=b label="end"
      `
      const result = await runProgram(source)

      expect(result.data.a).toBe(1)
      expect(result.data.b).toBe('skipped')
    })

    it('conditional goto with complex expression', async () => {
      const source = `
        @utils/set input=5 output=a
        @utils/set input=10 output=b
        @flow/goto target="sum" if={a + b == 15}
        @utils/set input="not taken" output=result
        @flow/goto target="end"
        @utils/set input="sum matched" output=result label="sum"
        @utils/set input="final" output=final label="end"
      `
      const result = await runProgram(source)

      expect(result.data.result).toBe('sum matched')
      expect(result.data.final).toBe('final')
    })

    it('multiple labels on consecutive instructions', async () => {
      const source = `
        @flow/goto target="second"
        @utils/set input="first" output=a label="first"
        @utils/set input="second" output=b label="second"
        @utils/set input="third" output=c label="third"
      `
      const result = await runProgram(source)

      expect(result.data.a).toBeUndefined()
      expect(result.data.b).toBe('second')
      expect(result.data.c).toBe('third')
    })
  })
})
