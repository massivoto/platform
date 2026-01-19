import { Stream } from '@masala/parser'
import {
  InstructionNode,
  ProgramNode,
  StatementNode,
} from './ast.js'
import { buildInstructionParser } from './instruction-parser.js'

/**
 * Result of parsing a program.
 */
export interface ProgramParseResult {
  isAccepted: () => boolean
  value?: ProgramNode
  error?: Error
}

/**
 * Parser for OTO programs (multi-line instructions).
 */
export interface ProgramParser {
  /**
   * Parse source code and return the ProgramNode directly.
   * @throws Error on parse failure
   */
  val(source: string): ProgramNode

  /**
   * Parse source code and return a result object.
   * Does not throw - check isAccepted() for success.
   */
  parse(source: string): ProgramParseResult
}

/**
 * Build a program parser that handles multiple newline-separated instructions.
 *
 * Strategy: Two-pass parsing
 * 1. Split source by newlines
 * 2. Parse each non-empty line as an instruction
 *
 * This avoids GenLex separator complexity and is more robust.
 */
export function buildProgramParser(): ProgramParser {
  const instructionParser = buildInstructionParser()

  return {
    /**
     * Parse source code and return the value directly.
     * Throws on parse error.
     */
    val(source: string): ProgramNode {
      const statements: StatementNode[] = []

      // Split by newlines (handle both \n and \r\n)
      const lines = source.split(/\r?\n/)

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()

        // Skip empty lines
        if (line === '') {
          continue
        }

        // Parse the line as an instruction
        const stream = Stream.ofChars(line)
        const result = instructionParser.parse(stream)

        if (!result.isAccepted()) {
          throw new Error(`Parse error on line ${i + 1}: ${line}`)
        }

        // Check that the entire line was consumed
        if (!result.isEos()) {
          throw new Error(`Unexpected content on line ${i + 1}: ${line}`)
        }

        statements.push(result.value as InstructionNode)
      }

      return {
        type: 'program',
        body: statements,
      }
    },

    /**
     * Parse source code and return a parsing result.
     */
    parse(source: string): ProgramParseResult {
      try {
        const value = this.val(source)
        return {
          isAccepted: () => true,
          value,
        }
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e))
        return {
          isAccepted: () => false,
          error,
        }
      }
    },
  }
}
