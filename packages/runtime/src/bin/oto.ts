#!/usr/bin/env node
/**
 * OTO CLI - Command-line interface for OTO automation scripts
 *
 * Requirements covered:
 * - R-LOCAL-10: `oto run <file>` parses and executes the specified .oto file
 * - R-LOCAL-11: `oto run <file> --var key=value` injects variables into context.data
 * - R-LOCAL-12: `oto run <file> --verbose` outputs execution log to stderr
 * - R-LOCAL-13: `oto check <file>` parses without executing, reports syntax errors
 * - R-LOCAL-14: Exit code is 0 on success, 1 on failure
 * - R-LOCAL-15: `--context <file>` or `-c` loads partial ExecutionContext from JSON
 * - R-LOCAL-16: Missing context fields get defaults
 * - R-LOCAL-17: `--var` overrides context.data values after context file load
 * - R-LOCAL-18: `--save <file>` or `-s` writes resulting context to file instead of stdout
 * - R-LOCAL-19: `--result` or `-r` outputs full ProgramResult instead of just ExecutionContext
 * - R-LOCAL-20: Default output is serialized ExecutionContext JSON to stdout
 * - R-LOCAL-21: `--verbose` outputs execution log entries to stderr
 * - R-LOCAL-22: Parse errors include line/column information when available
 * - R-LOCAL-23: `--save` suppresses stdout
 * - R-LOCAL-24: Context file errors exit with code 1 and message
 *
 * @example
 * ```bash
 * oto run script.oto
 * oto run script.oto --var name=Emma --var count=5
 * oto run script.oto -c context.json --save output.json
 * oto run script.oto --verbose --result
 * oto check script.oto
 * ```
 */
import { program } from 'commander'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { FileRunner } from '../runner/file-runner.js'
import {
  FileNotFoundError,
  InvalidExtensionError,
  ContextFileError,
} from '../runner/runner.types.js'
import type { ExecutionContext, ProgramResult } from '@massivoto/kit'

/**
 * Parse --var arguments into a key-value object.
 * Format: --var key=value --var key2=value2
 *
 * R-LOCAL-11: All values are strings (complex types deferred to later version)
 */
function parseVars(vars: string[] | undefined): Record<string, string> {
  if (!vars) return {}

  const result: Record<string, string> = {}
  for (const v of vars) {
    const eqIndex = v.indexOf('=')
    if (eqIndex === -1) {
      console.error(`Invalid --var format: "${v}". Expected key=value`)
      process.exit(1)
    }
    const key = v.slice(0, eqIndex)
    const value = v.slice(eqIndex + 1)
    result[key] = value
  }
  return result
}

/**
 * Load and parse context from a JSON file.
 *
 * R-LOCAL-15: Load partial ExecutionContext from JSON
 * R-LOCAL-16: Missing fields get defaults (handled by FileRunner)
 * R-LOCAL-24: Invalid file exits with code 1
 */
function loadContextFile(filePath: string): Partial<ExecutionContext> {
  const resolvedPath = resolve(filePath)

  if (!existsSync(resolvedPath)) {
    throw new ContextFileError(filePath, 'File not found')
  }

  try {
    const content = readFileSync(resolvedPath, 'utf-8')
    return JSON.parse(content) as Partial<ExecutionContext>
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ContextFileError(filePath, 'Invalid JSON', error)
    }
    throw new ContextFileError(
      filePath,
      error instanceof Error ? error.message : 'Unknown error',
      error instanceof Error ? error : undefined,
    )
  }
}

/**
 * Format verbose output for a ProgramResult.
 * Outputs to stderr so it doesn't interfere with JSON output.
 *
 * R-LOCAL-12, R-LOCAL-21: Verbose outputs to stderr
 */
function outputVerbose(result: ProgramResult): void {
  for (const batch of result.batches) {
    for (const action of batch.actions) {
      const status = action.success ? 'OK' : 'FAIL'
      const duration = `${action.duration}ms`
      const cost = action.cost > 0 ? ` [cost: ${action.cost}]` : ''
      const output = action.output ? ` -> ${action.output}` : ''

      console.error(
        `[${status}] ${action.command}${output} (${duration})${cost}`,
      )

      // Show messages
      for (const msg of action.messages) {
        console.error(`       ${msg}`)
      }

      // Show errors
      if (action.fatalError) {
        console.error(`       ERROR: ${action.fatalError}`)
      }
    }
  }

  // Summary
  const totalActions = result.batches.reduce(
    (sum, b) => sum + b.actions.length,
    0,
  )
  console.error(`---`)
  console.error(
    `Total: ${totalActions} actions, ${result.duration}ms, cost: ${result.cost.current}`,
  )
}

/**
 * Format error output for CLI.
 * R-LOCAL-22: Parse errors include line information
 */
function formatError(error: unknown): string {
  if (error instanceof FileNotFoundError) {
    return `Error: File not found: ${error.filePath}`
  }
  if (error instanceof InvalidExtensionError) {
    return `Error: Invalid file extension. File must have .oto or .oto.md extension: ${error.filePath}`
  }
  if (error instanceof ContextFileError) {
    return `Error: Context file error: ${error.reason} (${error.filePath})`
  }
  if (error instanceof Error) {
    return `Error: ${error.message}`
  }
  return `Error: ${String(error)}`
}

// =============================================================================
// CLI Definition
// =============================================================================

program
  .name('oto')
  .description('Execute OTO automation scripts')
  .version('0.5.0')

// R-LOCAL-10: oto run <file>
program
  .command('run <file>')
  .description('Execute an .oto file')
  .option('-c, --context <file>', 'Load ExecutionContext from JSON file')
  .option(
    '-s, --save <file>',
    'Save resulting context to file (instead of stdout)',
  )
  .option('-r, --result', 'Output full ProgramResult instead of just context')
  .option('--var <key=value...>', 'Set/override context.data variables')
  .option('--verbose', 'Show execution log on stderr')
  .action(
    async (
      file: string,
      options: {
        context?: string
        save?: string
        result?: boolean
        var?: string[]
        verbose?: boolean
      },
    ) => {
      try {
        const runner = new FileRunner({ verbose: options.verbose })

        // R-LOCAL-15: Load context from file if provided
        let context: Partial<ExecutionContext> = {}
        if (options.context) {
          context = loadContextFile(options.context)
        }

        // R-LOCAL-11, R-LOCAL-17: Apply --var overrides
        const vars = parseVars(options.var)
        if (Object.keys(vars).length > 0) {
          context.data = { ...(context.data || {}), ...vars }
        }

        // Execute the file
        const result = await runner.runFile(file, { context })

        // R-LOCAL-12, R-LOCAL-21: Verbose output to stderr
        if (options.verbose) {
          outputVerbose(result)
        }

        // R-LOCAL-19: Full result or just context
        const output = options.result ? result : result.context
        const outputJson = JSON.stringify(output, null, 2)

        // R-LOCAL-18, R-LOCAL-23: Save to file or stdout
        if (options.save) {
          writeFileSync(options.save, outputJson, 'utf-8')
        } else {
          console.log(outputJson)
        }

        // R-LOCAL-14: Exit code based on result
        process.exit(result.exitCode)
      } catch (error) {
        console.error(formatError(error))
        process.exit(1)
      }
    },
  )

// R-LOCAL-13: oto check <file>
program
  .command('check <file>')
  .description('Validate an .oto file without executing')
  .action(async (file: string) => {
    try {
      const runner = new FileRunner()
      const checkResult = await runner.checkFile(file)

      if (checkResult.valid) {
        console.log('Valid')
        process.exit(0)
      } else {
        console.error('Errors:')
        for (const err of checkResult.errors) {
          console.error(`  ${err}`)
        }
        process.exit(1)
      }
    } catch (error) {
      console.error(formatError(error))
      process.exit(1)
    }
  })

program.parse()
