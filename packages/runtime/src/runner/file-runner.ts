/**
 * FileRunner - File-based OTO program execution
 *
 * This is the core runner class for executing .oto files from the filesystem.
 * It wraps runProgram() with file I/O and validation.
 *
 * Requirements covered:
 * - R-LOCAL-01: LocalRunner class with constructor accepting optional RunnerOptions
 * - R-LOCAL-02: runFile() reads file from disk and executes with runProgram()
 * - R-LOCAL-03: runFile() throws FileNotFoundError if file does not exist
 * - R-LOCAL-04: runFile() throws InvalidExtensionError if file does not have .oto extension
 * - R-LOCAL-05: runFile() accepts RunOptions to inject initial context variables
 * - R-LOCAL-06: runFile() returns ProgramResult
 *
 * @example
 * ```typescript
 * const runner = new FileRunner({ verbose: true })
 * const result = await runner.runFile('script.oto', {
 *   context: { data: { name: 'Emma' } },
 * })
 * console.log(result.data) // { name: 'Emma', ... }
 * ```
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'

import { fromPartialContext, ProgramResult } from '../domain/index.js'
import { runProgram } from '../interpreter/program-runner.js'
import { buildProgramParser } from '../interpreter/parser/program-parser.js'
import {
  RunnerOptions,
  RunOptions,
  CheckResult,
  FileNotFoundError,
  InvalidExtensionError,
} from './runner.types.js'

/**
 * Valid file extensions for OTO programs.
 * - .oto - standard OTO script
 * - .oto.md - markdown-embedded OTO script (branding feature)
 */
const VALID_EXTENSIONS = ['.oto', '.oto.md']

/**
 * Check if a file path has a valid OTO extension.
 */
function hasValidExtension(filePath: string): boolean {
  const lower = filePath.toLowerCase()
  return VALID_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

/**
 * Get the file extension for error reporting.
 */
function getExtension(filePath: string): string {
  const basename = path.basename(filePath)
  const dotIndex = basename.indexOf('.')
  if (dotIndex === -1) return ''
  return basename.slice(dotIndex)
}

/**
 * FileRunner - Execute OTO programs from files.
 *
 * This class provides file-based program execution with:
 * - File existence and extension validation
 * - Context injection via RunOptions
 * - Parse-only validation via checkFile()
 * - Verbose logging support
 */
export class FileRunner {
  private readonly options: RunnerOptions

  /**
   * Create a new FileRunner instance.
   *
   * @param options - Optional configuration
   */
  constructor(options: RunnerOptions = {}) {
    this.options = options
  }

  /**
   * R-LOCAL-02: Run a program from a file path.
   *
   * @param filePath - Path to the .oto file
   * @param runOptions - Optional execution options (context, verbose)
   * @returns ProgramResult with context, batches, exitCode, etc.
   * @throws FileNotFoundError if file does not exist
   * @throws InvalidExtensionError if file does not have .oto extension
   * @throws ProgramRunError if parsing fails
   */
  async runFile(
    filePath: string,
    runOptions: RunOptions = {},
  ): Promise<ProgramResult> {
    // R-LOCAL-03: Validate file exists
    await this.validateFileExists(filePath)

    // R-LOCAL-04: Validate extension
    this.validateExtension(filePath)

    // Read file content
    const source = await fs.readFile(filePath, 'utf-8')

    // R-LOCAL-05: Build execution context from options
    const context = runOptions.context
      ? fromPartialContext(runOptions.context)
      : undefined

    // Execute the program
    // R-LOCAL-06: Returns ProgramResult
    const result = await runProgram(source, context, this.options.registry)

    return result
  }

  /**
   * Check a file for syntax errors without executing.
   *
   * @param filePath - Path to the .oto file
   * @returns CheckResult with valid flag and error messages
   * @throws FileNotFoundError if file does not exist
   * @throws InvalidExtensionError if file does not have .oto extension
   */
  async checkFile(filePath: string): Promise<CheckResult> {
    // Validate file exists and has correct extension
    await this.validateFileExists(filePath)
    this.validateExtension(filePath)

    // Read file content
    const source = await fs.readFile(filePath, 'utf-8')

    // Parse only (no execution)
    const parser = buildProgramParser()
    const parseResult = parser.parse(source)

    if (parseResult.isAccepted()) {
      return { valid: true, errors: [] }
    }

    // R-LOCAL-22: Parse errors include line information
    const errorMessage = parseResult.error?.message || 'Unknown parse error'
    return { valid: false, errors: [errorMessage] }
  }

  /**
   * Validate that the file exists.
   * @throws FileNotFoundError if file does not exist
   */
  private async validateFileExists(filePath: string): Promise<void> {
    try {
      await fs.access(filePath)
    } catch (error) {
      throw new FileNotFoundError(
        filePath,
        error instanceof Error ? error : undefined,
      )
    }
  }

  /**
   * Validate that the file has a valid extension.
   * @throws InvalidExtensionError if extension is not .oto or .oto.md
   */
  private validateExtension(filePath: string): void {
    if (!hasValidExtension(filePath)) {
      throw new InvalidExtensionError(filePath, getExtension(filePath))
    }
  }
}
