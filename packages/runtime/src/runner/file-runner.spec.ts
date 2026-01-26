/**
 * Tests for LocalRunner - File-based OTO execution
 *
 * Requirements covered:
 * - R-LOCAL-01: LocalRunner class with optional RunnerOptions
 * - R-LOCAL-02: runFile() reads file and executes with runProgram()
 * - R-LOCAL-03: runFile() throws FileNotFoundError if file does not exist
 * - R-LOCAL-04: runFile() throws InvalidExtensionError if not .oto extension
 * - R-LOCAL-05: runFile() accepts RunOptions to inject initial context variables
 * - R-LOCAL-06: runFile() returns ProgramResult
 *
 * Output requirements:
 * - R-LOCAL-20: Default output is serialized ExecutionContext JSON
 * - R-LOCAL-22: Parse errors include line information
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'

import { FileRunner } from './file-runner.js'
import { FileNotFoundError, InvalidExtensionError } from './runner.types.js'

describe('FileRunner', () => {
  let tempDir: string

  beforeAll(async () => {
    // Create a temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'oto-test-'))
  })

  afterAll(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  // Helper to create test files
  async function createTestFile(
    filename: string,
    content: string,
  ): Promise<string> {
    const filePath = path.join(tempDir, filename)
    await fs.writeFile(filePath, content, 'utf-8')
    return filePath
  }

  describe('R-LOCAL-01: LocalRunner class with constructor accepting optional RunnerOptions', () => {
    it('should create instance with no options', () => {
      const runner = new FileRunner()
      expect(runner).toBeInstanceOf(FileRunner)
    })

    it('should create instance with empty options', () => {
      const runner = new FileRunner({})
      expect(runner).toBeInstanceOf(FileRunner)
    })

    it('should create instance with verbose option', () => {
      const runner = new FileRunner({ verbose: true })
      expect(runner).toBeInstanceOf(FileRunner)
    })
  })

  describe('R-LOCAL-02: runFile() reads file from disk and executes with runProgram()', () => {
    it('should execute a simple .oto file and return result', async () => {
      const filePath = await createTestFile(
        'simple.oto',
        '@utils/set input="Emma" output=user',
      )

      const runner = new FileRunner()
      const result = await runner.runFile(filePath)

      expect(result.data.user).toBe('Emma')
      expect(result.exitCode).toBe(0)
    })

    it('should execute multi-line program', async () => {
      const filePath = await createTestFile(
        'multi.oto',
        `@utils/set input="Emma" output=user
@utils/set input=1500 output=followers`,
      )

      const runner = new FileRunner()
      const result = await runner.runFile(filePath)

      expect(result.data.user).toBe('Emma')
      expect(result.data.followers).toBe(1500)
    })

    it('should handle .oto.md extension (markdown OTO)', async () => {
      const filePath = await createTestFile(
        'readme.oto.md',
        '@utils/set input="markdown" output=format',
      )

      const runner = new FileRunner()
      const result = await runner.runFile(filePath)

      expect(result.data.format).toBe('markdown')
    })
  })

  describe('R-LOCAL-03: runFile() throws FileNotFoundError if file does not exist', () => {
    it('should throw FileNotFoundError for missing file', async () => {
      const runner = new FileRunner()
      const missingPath = path.join(tempDir, 'does-not-exist.oto')

      await expect(runner.runFile(missingPath)).rejects.toThrow(
        FileNotFoundError,
      )
    })

    it('should include file path in error message', async () => {
      const runner = new FileRunner()
      const missingPath = path.join(tempDir, 'missing.oto')

      await expect(runner.runFile(missingPath)).rejects.toThrow('missing.oto')
    })
  })

  describe('R-LOCAL-04: runFile() throws InvalidExtensionError if file does not have .oto extension', () => {
    it('should reject .txt files', async () => {
      const filePath = await createTestFile(
        'script.txt',
        '@utils/set input="test" output=x',
      )

      const runner = new FileRunner()
      await expect(runner.runFile(filePath)).rejects.toThrow(
        InvalidExtensionError,
      )
    })

    it('should reject files without extension', async () => {
      const filePath = await createTestFile(
        'script',
        '@utils/set input="test" output=x',
      )

      const runner = new FileRunner()
      await expect(runner.runFile(filePath)).rejects.toThrow(
        InvalidExtensionError,
      )
    })

    it('should reject .js files', async () => {
      const filePath = await createTestFile(
        'script.js',
        '@utils/set input="test" output=x',
      )

      const runner = new FileRunner()
      await expect(runner.runFile(filePath)).rejects.toThrow(
        InvalidExtensionError,
      )
    })

    it('should include expected extension in error message', async () => {
      const filePath = await createTestFile(
        'script.txt',
        '@utils/set input="test" output=x',
      )

      const runner = new FileRunner()
      await expect(runner.runFile(filePath)).rejects.toThrow('.oto')
    })
  })

  describe('R-LOCAL-05: runFile() accepts RunOptions to inject initial context variables', () => {
    it('should use initial context data', async () => {
      const filePath = await createTestFile(
        'context-test.oto',
        '@utils/set input={existingValue + 10} output=result',
      )

      const runner = new FileRunner()
      const result = await runner.runFile(filePath, {
        context: {
          data: { existingValue: 5 },
        },
      })

      expect(result.data.result).toBe(15)
    })

    it('should use initial context env', async () => {
      // Note: env vars are available but we can't easily test them without a command that exposes them
      // This test just verifies the context is passed through
      const filePath = await createTestFile(
        'env-test.oto',
        '@utils/set input="done" output=status',
      )

      const runner = new FileRunner()
      const result = await runner.runFile(filePath, {
        context: {
          env: { API_KEY: 'secret-123' },
        },
      })

      // env should be preserved in context
      expect(result.context.env.API_KEY).toBe('secret-123')
    })

    it('should merge partial context with defaults', async () => {
      const filePath = await createTestFile(
        'partial-context.oto',
        '@utils/set input="merged" output=status',
      )

      const runner = new FileRunner()
      const result = await runner.runFile(filePath, {
        context: {
          data: { x: 1 },
        },
      })

      // Should have both the injected value and the script output
      expect(result.data.x).toBe(1)
      expect(result.data.status).toBe('merged')
    })
  })

  describe('R-LOCAL-06: runFile() returns ProgramResult with success, batches[], context, totalCost', () => {
    it('should return ProgramResult structure', async () => {
      const filePath = await createTestFile(
        'result-test.oto',
        '@utils/set input="test" output=x',
      )

      const runner = new FileRunner()
      const result = await runner.runFile(filePath)

      // ProgramResult fields
      expect(result).toHaveProperty('exitCode')
      expect(result).toHaveProperty('exitedEarly')
      expect(result).toHaveProperty('batches')
      expect(result).toHaveProperty('context')
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('cost')
      expect(result).toHaveProperty('duration')
    })

    it('should have batches with actions', async () => {
      const filePath = await createTestFile(
        'batches-test.oto',
        `@utils/set input="a" output=x
@utils/set input="b" output=y`,
      )

      const runner = new FileRunner()
      const result = await runner.runFile(filePath)

      expect(result.batches.length).toBeGreaterThan(0)
      // Actions should be tracked
      const allActions = result.batches.flatMap((b) => b.actions)
      expect(allActions.length).toBeGreaterThanOrEqual(2)
    })

    it('should have cost tracking', async () => {
      const filePath = await createTestFile(
        'cost-test.oto',
        '@utils/set input="test" output=x',
      )

      const runner = new FileRunner()
      const result = await runner.runFile(filePath)

      expect(result.cost).toHaveProperty('current')
      expect(typeof result.cost.current).toBe('number')
    })
  })

  describe('checkFile() - Parse validation without execution', () => {
    it('should return valid: true for valid OTO file', async () => {
      const filePath = await createTestFile(
        'valid.oto',
        '@utils/set input="test" output=x',
      )

      const runner = new FileRunner()
      const result = await runner.checkFile(filePath)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return valid: false for invalid syntax', async () => {
      const filePath = await createTestFile(
        'invalid.oto',
        'this is not valid OTO syntax',
      )

      const runner = new FileRunner()
      const result = await runner.checkFile(filePath)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should include line number in parse error', async () => {
      const filePath = await createTestFile(
        'line-error.oto',
        `@utils/set input="valid" output=x
invalid line here
@utils/set input="valid" output=y`,
      )

      const runner = new FileRunner()
      const result = await runner.checkFile(filePath)

      expect(result.valid).toBe(false)
      // Error should mention line 2
      expect(result.errors.some((e) => e.includes('line 2'))).toBe(true)
    })

    it('should throw FileNotFoundError for missing file', async () => {
      const runner = new FileRunner()
      const missingPath = path.join(tempDir, 'check-missing.oto')

      await expect(runner.checkFile(missingPath)).rejects.toThrow(
        FileNotFoundError,
      )
    })

    it('should throw InvalidExtensionError for wrong extension', async () => {
      const filePath = await createTestFile(
        'check-bad.txt',
        '@utils/set input="test" output=x',
      )

      const runner = new FileRunner()
      await expect(runner.checkFile(filePath)).rejects.toThrow(
        InvalidExtensionError,
      )
    })
  })

  describe('R-LOCAL-22: Parse errors include line/column information', () => {
    it('should throw parse error with line info on execution', async () => {
      const filePath = await createTestFile(
        'parse-error.oto',
        `@utils/set input="valid" output=x
broken syntax here
@utils/set input="valid" output=y`,
      )

      const runner = new FileRunner()

      try {
        await runner.runFile(filePath)
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error.message).toContain('line')
      }
    })
  })

  describe('Verbose mode', () => {
    it('should accept verbose option in constructor', async () => {
      const filePath = await createTestFile(
        'verbose.oto',
        '@utils/set input="test" output=x',
      )

      const runner = new FileRunner({ verbose: true })
      const result = await runner.runFile(filePath)

      // Verbose mode doesn't change the result, just output behavior
      expect(result.data.x).toBe('test')
    })

    it('should accept verbose override in runFile options', async () => {
      const filePath = await createTestFile(
        'verbose-override.oto',
        '@utils/set input="test" output=x',
      )

      const runner = new FileRunner({ verbose: false })
      const result = await runner.runFile(filePath, { verbose: true })

      expect(result.data.x).toBe('test')
    })
  })

  describe('AC-LOCAL-01: hello.oto execution', () => {
    it('Given hello.oto with @utils/set, when running, then stdout is valid JSON with data.user equal to "Emma"', async () => {
      const filePath = await createTestFile(
        'hello.oto',
        '@utils/set input="Emma" output=user',
      )

      const runner = new FileRunner()
      const result = await runner.runFile(filePath)

      expect(result.data.user).toBe('Emma')
      expect(result.exitCode).toBe(0)

      // Result should be JSON serializable
      const json = JSON.stringify(result.context)
      const parsed = JSON.parse(json)
      expect(parsed.data.user).toBe('Emma')
    })
  })

  describe('AC-LOCAL-15 & AC-LOCAL-16: Programmatic API', () => {
    it('runner.runFile() returns ProgramResult promise', async () => {
      const filePath = await createTestFile(
        'api-test.oto',
        '@utils/set input="test" output=x',
      )

      const runner = new FileRunner()
      const resultPromise = runner.runFile(filePath)

      expect(resultPromise).toBeInstanceOf(Promise)
      const result = await resultPromise
      expect(result.data.x).toBe('test')
    })

    it('RunOptions with context.data makes variables available', async () => {
      const filePath = await createTestFile(
        'api-context.oto',
        '@utils/set input={x * 2} output=doubled',
      )

      const runner = new FileRunner()
      const result = await runner.runFile(filePath, {
        context: { data: { x: 21 } },
      })

      expect(result.data.doubled).toBe(42)
    })
  })
})
