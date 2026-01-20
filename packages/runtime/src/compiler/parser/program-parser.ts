import { Stream } from '@masala/parser'
import {
  BlockNode,
  ExpressionNode,
  InstructionNode,
  ProgramNode,
  StatementNode,
} from './ast.js'
import { stripComments } from './comments.js'
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
 * Check if an instruction is @block/begin
 */
function isBlockBegin(instruction: InstructionNode): boolean {
  return (
    instruction.action.package === 'block' &&
    instruction.action.name === 'begin'
  )
}

/**
 * Check if an instruction is @block/end
 */
function isBlockEnd(instruction: InstructionNode): boolean {
  return (
    instruction.action.package === 'block' && instruction.action.name === 'end'
  )
}

/**
 * Extract block metadata from @block/begin instruction
 */
function extractBlockMeta(instruction: InstructionNode): {
  name?: string
  condition?: ExpressionNode
} {
  let name: string | undefined
  let condition: ExpressionNode | undefined

  for (const arg of instruction.args) {
    if (arg.name.value === 'name') {
      if (arg.value.type === 'literal-string') {
        name = arg.value.value
      }
    }
  }

  // if= is stored in instruction.condition for reserved args
  if (instruction.condition) {
    condition = instruction.condition
  }

  return { name, condition }
}

/**
 * Represents a block being built during parsing
 */
interface BlockContext {
  name?: string
  condition?: ExpressionNode
  body: StatementNode[]
  startLine: number
}

/**
 * Build a program parser that handles multiple newline-separated instructions
 * and block structures.
 *
 * Strategy:
 * 1. Split source by newlines
 * 2. Parse each line as an instruction
 * 3. Detect @block/begin and @block/end to build block structures
 * 4. Use a stack to handle nested blocks
 */
export function buildProgramParser(): ProgramParser {
  const instructionParser = buildInstructionParser()

  function parseStatements(
    lines: string[],
    startIndex: number = 0,
  ): StatementNode[] {
    const statements: StatementNode[] = []
    const blockStack: BlockContext[] = []

    for (let i = startIndex; i < lines.length; i++) {
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

      if (!result.isEos()) {
        throw new Error(`Unexpected content on line ${i + 1}: ${line}`)
      }

      const instruction = result.value as InstructionNode

      if (isBlockBegin(instruction)) {
        // Start a new block
        const meta = extractBlockMeta(instruction)
        blockStack.push({
          name: meta.name,
          condition: meta.condition,
          body: [],
          startLine: i + 1,
        })
      } else if (isBlockEnd(instruction)) {
        // Close the current block
        if (blockStack.length === 0) {
          throw new Error(
            `Unexpected @block/end at line ${i + 1} (no matching @block/begin)`,
          )
        }

        const blockContext = blockStack.pop()!
        const blockNode: BlockNode = {
          type: 'block',
          name: blockContext.name,
          condition: blockContext.condition,
          body: blockContext.body,
        }

        // Add to parent block or root statements
        if (blockStack.length > 0) {
          blockStack[blockStack.length - 1].body.push(blockNode)
        } else {
          statements.push(blockNode)
        }
      } else {
        // Regular instruction
        if (blockStack.length > 0) {
          blockStack[blockStack.length - 1].body.push(instruction)
        } else {
          statements.push(instruction)
        }
      }
    }

    // Check for unclosed blocks
    if (blockStack.length > 0) {
      const unclosed = blockStack[blockStack.length - 1]
      throw new Error(
        `Unclosed block (missing @block/end) - block started at line ${unclosed.startLine}`,
      )
    }

    return statements
  }

  return {
    val(source: string): ProgramNode {
      // Strip comments before parsing
      const cleanSource = stripComments(source)
      const lines = cleanSource.split(/\r?\n/)
      const statements = parseStatements(lines)

      return {
        type: 'program',
        body: statements,
      }
    },

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
