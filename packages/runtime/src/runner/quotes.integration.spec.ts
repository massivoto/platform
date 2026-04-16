/**
 * Integration tests for single-quote string support (quotes feature, v0.6)
 *
 * Verifies that the OTO runtime correctly parses and executes programs
 * using single-quoted strings, mixed quotes, and that \" escape is removed.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'

import { FileRunner } from './file-runner.js'

describe('Quotes: single-quote string support', () => {
  let tempDir: string

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'oto-quotes-'))
  })

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  async function createTestFile(
    filename: string,
    content: string,
  ): Promise<string> {
    const filePath = path.join(tempDir, filename)
    await fs.writeFile(filePath, content, 'utf-8')
    return filePath
  }

  describe('single-quoted strings', () => {
    it('should execute with single-quoted string value', async () => {
      const filePath = await createTestFile(
        'single-basic.oto',
        "@utils/set input='Emma' output=user",
      )

      const runner = new FileRunner()
      const result = await runner.runFile(filePath)

      expect(result.data.user).toBe('Emma')
      expect(result.exitCode).toBe(0)
    })

    it('should handle empty single-quoted string', async () => {
      const filePath = await createTestFile(
        'single-empty.oto',
        "@utils/set input='' output=empty",
      )

      const runner = new FileRunner()
      const result = await runner.runFile(filePath)

      expect(result.data.empty).toBe('')
    })

    it('should handle double quotes inside single-quoted string', async () => {
      const filePath = await createTestFile(
        'single-with-double.oto',
        `@utils/set input='He said "hello" to them' output=msg`,
      )

      const runner = new FileRunner()
      const result = await runner.runFile(filePath)

      expect(result.data.msg).toBe('He said "hello" to them')
    })
  })

  describe('double-quoted strings with single quotes inside', () => {
    it('should handle single quotes inside double-quoted string', async () => {
      const filePath = await createTestFile(
        'double-with-single.oto',
        `@utils/set input="the customer's feedback" output=msg`,
      )

      const runner = new FileRunner()
      const result = await runner.runFile(filePath)

      expect(result.data.msg).toBe("the customer's feedback")
    })
  })

  describe('mixed quotes in multi-line programs', () => {
    it('should mix single and double quotes across lines', async () => {
      const filePath = await createTestFile(
        'mixed-lines.oto',
        `@utils/set input='first value' output=a
@utils/set input="second value" output=b
@utils/set input='third with "quotes"' output=c
@utils/set input="fourth with 'quotes'" output=d`,
      )

      const runner = new FileRunner()
      const result = await runner.runFile(filePath)

      expect(result.data.a).toBe('first value')
      expect(result.data.b).toBe('second value')
      expect(result.data.c).toBe('third with "quotes"')
      expect(result.data.d).toBe("fourth with 'quotes'")
    })
  })

  describe('escape sequences work in both delimiters', () => {
    it('should handle \\n in single-quoted string', async () => {
      const filePath = await createTestFile(
        'escape-n-single.oto',
        "@utils/set input='line1\\nline2' output=msg",
      )

      const runner = new FileRunner()
      const result = await runner.runFile(filePath)

      expect(result.data.msg).toBe('line1\nline2')
    })

    it('should handle \\t in single-quoted string', async () => {
      const filePath = await createTestFile(
        'escape-t-single.oto',
        "@utils/set input='col1\\tcol2' output=msg",
      )

      const runner = new FileRunner()
      const result = await runner.runFile(filePath)

      expect(result.data.msg).toBe('col1\tcol2')
    })

    it('should handle \\\\ in single-quoted string', async () => {
      const filePath = await createTestFile(
        'escape-backslash-single.oto',
        "@utils/set input='C:\\\\Users\\\\name' output=msg",
      )

      const runner = new FileRunner()
      const result = await runner.runFile(filePath)

      expect(result.data.msg).toBe('C:\\Users\\name')
    })

    it('should handle \\n in double-quoted string', async () => {
      const filePath = await createTestFile(
        'escape-n-double.oto',
        '@utils/set input="line1\\nline2" output=msg',
      )

      const runner = new FileRunner()
      const result = await runner.runFile(filePath)

      expect(result.data.msg).toBe('line1\nline2')
    })
  })

  describe('comments inside quoted strings are preserved', () => {
    it('should preserve // inside single-quoted string', async () => {
      const filePath = await createTestFile(
        'comment-in-single.oto',
        "@utils/set input='https://example.com' output=url",
      )

      const runner = new FileRunner()
      const result = await runner.runFile(filePath)

      expect(result.data.url).toBe('https://example.com')
    })

    it('should preserve // inside double-quoted string', async () => {
      const filePath = await createTestFile(
        'comment-in-double.oto',
        '@utils/set input="https://example.com" output=url',
      )

      const runner = new FileRunner()
      const result = await runner.runFile(filePath)

      expect(result.data.url).toBe('https://example.com')
    })
  })

  describe('expressions with single-quoted strings', () => {
    it('should use single-quoted string in expression', async () => {
      const filePath = await createTestFile(
        'expr-single.oto',
        `@utils/set input='hello' output=greeting
@utils/set input={greeting + ' world'} output=msg`,
      )

      const runner = new FileRunner()
      const result = await runner.runFile(filePath)

      expect(result.data.msg).toBe('hello world')
    })

    it('should compare with single-quoted string', async () => {
      const filePath = await createTestFile(
        'expr-compare.oto',
        `@utils/set input='yes' output=answer
@utils/set input={answer == 'yes'} output=isYes`,
      )

      const runner = new FileRunner()
      const result = await runner.runFile(filePath)

      expect(result.data.isYes).toBe(true)
    })
  })

  describe('backslash-quote no longer escapes', () => {
    it('should reject \\" as invalid inside double-quoted string', async () => {
      // OTO source: @utils/set input="say \"hello\"" output=msg
      // The \" is NOT a valid escape anymore, so the parser should see
      // "say \" as a string (backslash is just a char), then fail on the rest
      const filePath = await createTestFile(
        'no-escape-dquote.oto',
        '@utils/set input="say \\"hello\\"" output=msg',
      )

      const runner = new FileRunner()
      const result = await runner.checkFile(filePath)

      expect(result.valid).toBe(false)
    })
  })
})
