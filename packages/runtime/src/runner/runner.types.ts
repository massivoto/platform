/**
 * Runner Types - Shared types for LocalRunner and CLI
 *
 * Requirements:
 * - R-LOCAL-01: RunnerOptions for LocalRunner constructor
 * - R-LOCAL-03: FileNotFoundError
 * - R-LOCAL-04: InvalidExtensionError
 * - R-LOCAL-05: RunOptions for context injection
 */
import type { ExecutionContext } from '@massivoto/kit'
import type { CommandRegistry } from '../interpreter/command-registry/command-registry.js'

/**
 * Options for creating a FileRunner instance.
 *
 * @example
 * ```typescript
 * const runner = new FileRunner({
 *   verbose: true,
 *   registry: customRegistry,
 * })
 * ```
 */
export interface RunnerOptions {
  /** Custom command registry (uses standard handlers if not provided) */
  registry?: CommandRegistry

  /** Enable verbose logging to stderr */
  verbose?: boolean
}

/**
 * Options for a single run invocation.
 *
 * @example
 * ```typescript
 * const result = await runner.runFile('script.oto', {
 *   context: { data: { name: 'Emma' } },
 *   verbose: true,
 * })
 * ```
 */
export interface RunOptions {
  /** Initial context variables (merged with empty context) */
  context?: Partial<ExecutionContext>

  /** Override runner verbose setting for this run */
  verbose?: boolean
}

/**
 * Result of file validation (checkFile).
 */
export interface CheckResult {
  /** Whether the file parsed successfully */
  valid: boolean

  /** Parse error messages (empty if valid) */
  errors: string[]
}

// =============================================================================
// Errors
// =============================================================================

/**
 * R-LOCAL-03: Error thrown when the specified file does not exist.
 */
export class FileNotFoundError extends Error {
  constructor(
    public readonly filePath: string,
    cause?: Error,
  ) {
    super(`File not found: ${filePath}`)
    this.name = 'FileNotFoundError'
    this.cause = cause
  }
}

/**
 * R-LOCAL-04: Error thrown when the file does not have a valid .oto extension.
 *
 * Valid extensions: .oto, .oto.md
 */
export class InvalidExtensionError extends Error {
  constructor(
    public readonly filePath: string,
    public readonly extension: string,
  ) {
    super(
      `Invalid file extension "${extension}". File must have .oto or .oto.md extension: ${filePath}`,
    )
    this.name = 'InvalidExtensionError'
  }
}

/**
 * Error thrown when context file is invalid (not found or invalid JSON).
 */
export class ContextFileError extends Error {
  constructor(
    public readonly filePath: string,
    public readonly reason: string,
    cause?: Error,
  ) {
    super(`Context file error: ${reason} (${filePath})`)
    this.name = 'ContextFileError'
    this.cause = cause
  }
}
