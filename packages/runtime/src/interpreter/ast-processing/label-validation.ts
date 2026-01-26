/**
 * Label Validation - AST Post-Processing
 *
 * Requirements:
 * - R-GOTO-61: Detect duplicate labels and report both locations
 * - R-GOTO-62: Detect @flow/goto target="x" where no label="x" exists
 * - R-GOTO-63: Build label index for interpreter optimization
 */
import type {
  ProgramNode,
  InstructionNode,
  StatementNode,
} from '../parser/ast.js'

/**
 * Error type for label validation failures.
 */
export type LabelValidationErrorType =
  | 'duplicate-label'
  | 'unknown-target'
  | 'missing-target'

/**
 * Error thrown when label validation fails.
 * Contains detailed information about the error for debugging.
 */
export class LabelValidationError extends Error {
  constructor(
    message: string,
    public readonly type: LabelValidationErrorType,
    public readonly label?: string,
    public readonly target?: string,
    public readonly locations?: number[],
    public readonly gotoLocation?: number,
  ) {
    super(message)
    this.name = 'LabelValidationError'
  }
}

/**
 * Options for label validation.
 */
export interface ValidateLabelsOptions {
  /**
   * If true, collect all errors instead of throwing on the first one.
   * @default false
   */
  collectAll?: boolean
}

/**
 * Flatten a program into a list of instructions for validation.
 * Blocks are expanded (their body instructions are included).
 */
function flattenInstructions(program: ProgramNode): InstructionNode[] {
  const instructions: InstructionNode[] = []

  const flatten = (statements: StatementNode[]) => {
    for (const statement of statements) {
      if (statement.type === 'instruction') {
        instructions.push(statement)
      } else if (statement.type === 'block') {
        flatten(statement.body)
      }
      // TemplateNode and other types are skipped
    }
  }

  flatten(program.body)
  return instructions
}

/**
 * Build a label index mapping label names to instruction indices.
 * R-GOTO-63: Optimization for interpreter - avoid runtime scanning.
 *
 * @param program - The program AST
 * @returns Map from label names to 0-based instruction indices
 */
export function buildLabelIndex(program: ProgramNode): Map<string, number> {
  const instructions = flattenInstructions(program)
  const index = new Map<string, number>()

  for (let i = 0; i < instructions.length; i++) {
    const instruction = instructions[i]
    if (instruction.label) {
      index.set(instruction.label, i)
    }
  }

  return index
}

/**
 * Result of finding goto instructions in a program.
 */
interface GotoInfo {
  /** Gotos with valid string targets */
  validTargets: Array<{ target: string; index: number }>
  /** Gotos missing the target argument (R-GOTO-05) */
  missingTargets: Array<{ index: number }>
}

/**
 * Find all goto instructions in the program.
 * Returns both valid gotos and those missing targets.
 */
function findGotoInstructions(instructions: InstructionNode[]): GotoInfo {
  const validTargets: Array<{ target: string; index: number }> = []
  const missingTargets: Array<{ index: number }> = []

  for (let i = 0; i < instructions.length; i++) {
    const instruction = instructions[i]
    if (
      instruction.action.package === 'flow' &&
      instruction.action.name === 'goto'
    ) {
      // Find the target argument
      const targetArg = instruction.args.find(
        (arg) => arg.name.value === 'target',
      )
      if (targetArg && targetArg.value.type === 'literal-string') {
        validTargets.push({ target: targetArg.value.value, index: i })
      } else {
        // R-GOTO-05: @flow/goto without target is an error
        missingTargets.push({ index: i })
      }
    }
  }

  return { validTargets, missingTargets }
}

/**
 * Validate labels in a program AST.
 *
 * R-GOTO-61: Detects duplicate labels and reports both locations
 * R-GOTO-62: Detects unknown goto targets
 *
 * @param program - The program AST to validate
 * @param options - Validation options
 * @returns Array of errors if collectAll is true, otherwise throws on first error
 * @throws LabelValidationError if validation fails and collectAll is false
 */
export function validateLabels(
  program: ProgramNode,
  options: ValidateLabelsOptions = {},
): LabelValidationError[] {
  const { collectAll = false } = options
  const errors: LabelValidationError[] = []
  const instructions = flattenInstructions(program)

  // Track all label locations for duplicate detection
  const labelLocations = new Map<string, number[]>()

  // Pass 1: Collect all labels and their locations
  for (let i = 0; i < instructions.length; i++) {
    const instruction = instructions[i]
    if (instruction.label) {
      const locations = labelLocations.get(instruction.label) || []
      locations.push(i)
      labelLocations.set(instruction.label, locations)
    }
  }

  // Check for duplicate labels (R-GOTO-61)
  for (const [label, locations] of labelLocations) {
    if (locations.length > 1) {
      const error = new LabelValidationError(
        `Duplicate label "${label}" found at instructions ${locations.join(', ')}`,
        'duplicate-label',
        label,
        undefined,
        locations,
        undefined,
      )

      if (!collectAll) {
        throw error
      }
      errors.push(error)
    }
  }

  // Build set of valid labels
  const validLabels = new Set(labelLocations.keys())

  // Pass 2: Check all goto instructions
  const gotoInfo = findGotoInstructions(instructions)

  // R-GOTO-05: Check for gotos missing target argument
  for (const { index } of gotoInfo.missingTargets) {
    const error = new LabelValidationError(
      `@flow/goto at instruction ${index} is missing required "target" argument`,
      'missing-target',
      undefined,
      undefined,
      undefined,
      index,
    )

    if (!collectAll) {
      throw error
    }
    errors.push(error)
  }

  // R-GOTO-62: Check for unknown targets
  for (const { target, index } of gotoInfo.validTargets) {
    if (!validLabels.has(target)) {
      const error = new LabelValidationError(
        `Unknown goto target "${target}" at instruction ${index}`,
        'unknown-target',
        undefined,
        target,
        undefined,
        index,
      )

      if (!collectAll) {
        throw error
      }
      errors.push(error)
    }
  }

  return errors
}

/**
 * Validate and build label index in one pass.
 * Combines validation with index building for efficiency.
 *
 * @param program - The program AST
 * @returns Label index map if valid
 * @throws LabelValidationError if validation fails
 */
export function validateAndBuildLabelIndex(
  program: ProgramNode,
): Map<string, number> {
  // First validate
  validateLabels(program)

  // Then build index
  return buildLabelIndex(program)
}
