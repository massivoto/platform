import { describe, it, expect } from 'vitest'
import { runProgram } from './program-runner.js'

describe('Flow Commands', () => {
  describe('@flow/goto', () => {
    describe('R-GOTO-41: @flow/goto command with target arg', () => {
      it('AC-GOTO-01: Emma uses @flow/goto target="retry" to jump back', async () => {
        const source = `
          @utils/set input=0 output=counter
          @utils/set input={counter + 1} output=counter label="retry"
          @flow/goto target="done" if={counter >= 3}
          @flow/goto target="retry"
          @utils/set input="completed" output=status label="done"
        `
        const result = await runProgram(source)

        expect(result.exitCode).toBe(0)
        expect(result.context.data.counter).toBe(3)
        expect(result.context.data.status).toBe('completed')
      })

      it('jumps forward to a label', async () => {
        const source = `
          @utils/set input="start" output=status
          @flow/goto target="end"
          @utils/set input="middle" output=status
          @utils/set input="finish" output=status label="end"
        `
        const result = await runProgram(source)

        expect(result.context.data.status).toBe('finish')
      })

      it('jumps backward to a label', async () => {
        const source = `
          @utils/set input=0 output=count
          @utils/set input={count + 1} output=count label="loop"
          @flow/goto target="done" if={count == 5}
          @flow/goto target="loop"
          @utils/set input="final" output=status label="done"
        `
        const result = await runProgram(source)

        expect(result.context.data.count).toBe(5)
        expect(result.context.data.status).toBe('final')
      })
    })

    describe('R-GOTO-42/43: @flow/goto with if={condition}', () => {
      it('AC-GOTO-02: Carlos uses conditional goto - no jump when condition is false', async () => {
        const source = `
          @utils/set input=5 output=x
          @flow/goto target="skip" if={x > 10}
          @utils/set input="not skipped" output=message
          @utils/set input="end" output=final label="skip"
        `
        const result = await runProgram(source)

        expect(result.context.data.x).toBe(5)
        expect(result.context.data.message).toBe('not skipped')
        expect(result.context.data.final).toBe('end')
      })

      it('jumps when condition is true', async () => {
        const source = `
          @utils/set input=15 output=x
          @flow/goto target="skip" if={x > 10}
          @utils/set input="should be skipped" output=message
          @utils/set input="end" output=final label="skip"
        `
        const result = await runProgram(source)

        expect(result.context.data.x).toBe(15)
        expect(result.context.data.message).toBeUndefined()
        expect(result.context.data.final).toBe('end')
      })
    })

    describe('R-GOTO-25: Goto preserves execution context', () => {
      it('variables are preserved when jumping', async () => {
        const source = `
          @utils/set input="Alice" output=user
          @utils/set input=100 output=score
          @flow/goto target="check"
          @utils/set input="Bob" output=user
          @utils/set input={score * 2} output=score label="check"
        `
        const result = await runProgram(source)

        expect(result.context.data.user).toBe('Alice')
        expect(result.context.data.score).toBe(200)
      })
    })
  })

  describe('@flow/exit', () => {
    describe('R-GOTO-44/45: @flow/exit terminates program', () => {
      it('AC-GOTO-06: Marco uses @flow/exit code=1 on error', async () => {
        const source = `
          @utils/set input="error detected" output=message
          @flow/exit code=1
          @utils/set input="never reached" output=message
        `
        const result = await runProgram(source)

        expect(result.exitCode).toBe(1)
        expect(result.exitedEarly).toBe(true)
        expect(result.context.data.message).toBe('error detected')
      })

      it('@flow/exit with default code=0', async () => {
        const source = `
          @utils/set input="done" output=status
          @flow/exit
          @utils/set input="after" output=status
        `
        const result = await runProgram(source)

        expect(result.exitCode).toBe(0)
        expect(result.exitedEarly).toBe(true)
        expect(result.context.data.status).toBe('done')
      })

      it('@flow/exit with exit code expression', async () => {
        const source = `
          @utils/set input=2 output=errorType
          @flow/exit code={errorType + 1}
        `
        const result = await runProgram(source)

        expect(result.exitCode).toBe(3)
        expect(result.exitedEarly).toBe(true)
      })
    })

    describe('R-GOTO-46: @flow/exit with if={condition}', () => {
      it('exits when condition is true', async () => {
        const source = `
          @utils/set input=true output=hasError
          @flow/exit code=1 if=hasError
          @utils/set input="ok" output=status
        `
        const result = await runProgram(source)

        expect(result.exitCode).toBe(1)
        expect(result.exitedEarly).toBe(true)
        expect(result.context.data.status).toBeUndefined()
      })

      it('does not exit when condition is false', async () => {
        const source = `
          @utils/set input=false output=hasError
          @flow/exit code=1 if=hasError
          @utils/set input="ok" output=status
        `
        const result = await runProgram(source)

        expect(result.exitCode).toBe(0)
        expect(result.exitedEarly).toBe(false)
        expect(result.context.data.status).toBe('ok')
      })
    })
  })

  describe('@flow/return', () => {
    describe('R-GOTO-47/48: @flow/return terminates with value', () => {
      it('AC-GOTO-08: Dave uses @flow/return value={total * 1.2}', async () => {
        const source = `
          @utils/set input=100 output=total
          @flow/return value={total * 1.2}
          @utils/set input="unreached" output=status
        `
        const result = await runProgram(source)

        expect(result.value).toBe(120)
        expect(result.exitCode).toBe(0)
        expect(result.exitedEarly).toBe(true)
        expect(result.context.data.status).toBeUndefined()
      })

      it('@flow/return with string value', async () => {
        const source = `
          @flow/return value="success"
        `
        const result = await runProgram(source)

        expect(result.value).toBe('success')
        expect(result.exitCode).toBe(0)
        expect(result.exitedEarly).toBe(true)
      })

      it('@flow/return with object expression', async () => {
        const source = `
          @utils/set input="Alice" output=name
          @utils/set input=42 output=score
          @flow/return value={name}
        `
        const result = await runProgram(source)

        expect(result.value).toBe('Alice')
        expect(result.exitCode).toBe(0)
      })
    })

    describe('R-GOTO-49: @flow/return with if={condition}', () => {
      it('returns when condition is true', async () => {
        const source = `
          @utils/set input=true output=done
          @utils/set input=42 output=result
          @flow/return value=result if=done
          @utils/set input=0 output=result
        `
        const result = await runProgram(source)

        expect(result.value).toBe(42)
        expect(result.exitedEarly).toBe(true)
      })

      it('does not return when condition is false', async () => {
        const source = `
          @utils/set input=false output=done
          @utils/set input=42 output=result
          @flow/return value=result if=done
          @utils/set input=100 output=result
        `
        const result = await runProgram(source)

        expect(result.exitCode).toBe(0)
        expect(result.exitedEarly).toBe(false)
        expect(result.context.data.result).toBe(100)
      })
    })
  })

  describe('Combined flow control', () => {
    it('retry pattern with goto and exit', async () => {
      const source = `
        @utils/set input=0 output=attempts
        @utils/set input={attempts + 1} output=attempts label="retry"
        @flow/goto target="success" if={attempts == 2}
        @flow/goto target="retry" if={attempts < 5}
        @flow/exit code=1
        @utils/set input="done" output=status label="success"
      `
      const result = await runProgram(source)

      expect(result.exitCode).toBe(0)
      expect(result.context.data.attempts).toBe(2)
      expect(result.context.data.status).toBe('done')
    })

    it('early return on success', async () => {
      const source = `
        @utils/set input=200 output=status
        @flow/return value="success" if={status == 200}
        @flow/return value="error"
      `
      const result = await runProgram(source)

      expect(result.value).toBe('success')
      expect(result.exitCode).toBe(0)
    })

    it('complex branching with multiple labels', async () => {
      const source = `
        @utils/set input=1 output=choice
        @flow/goto target="case2" if={choice == 2}
        @flow/goto target="case3" if={choice == 3}
        @utils/set input="case1" output=result
        @flow/goto target="end"
        @utils/set input="case2" output=result label="case2"
        @flow/goto target="end"
        @utils/set input="case3" output=result label="case3"
        @flow/goto target="end"
        @utils/set input="final" output=final label="end"
      `
      const result = await runProgram(source)

      expect(result.context.data.result).toBe('case1')
      expect(result.context.data.final).toBe('final')
    })
  })
})
