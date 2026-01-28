import { ReadableDate } from '../time'

/**
 * ActionLog - Execution log for a single Action.
 *
 * Part of the marketing-friendly result hierarchy:
 * - ProgramResult (program-level)
 * - BatchResult (batch-level aggregation)
 * - ActionLog (action-level)
 *
 * ActionLog is the marketing term for what was previously called InstructionLog.
 * An "Action" is what users write: `@pkg/name args...` (billable unit).
 *
 * @example
 * ```typescript
 * const log: ActionLog = {
 *   command: '@utils/set',
 *   success: true,
 *   start: '2026-01-20T10:00:00.000Z',
 *   end: '2026-01-20T10:00:00.005Z',
 *   duration: 5,
 *   messages: ['Set user to Emma'],
 *   cost: 0,
 *   output: 'user',
 *   value: 'Emma',
 * }
 * ```
 */
export interface ActionLog {
  /** Command identifier, e.g., '@utils/set' */
  command: string

  /** Whether the action executed successfully */
  success: boolean

  /** Error message if the action failed */
  fatalError?: string

  /** Start timestamp in ISO format */
  start: ReadableDate

  /** End timestamp in ISO format */
  end: ReadableDate

  /** Duration in milliseconds */
  duration: number

  /** Messages from the action (info, warnings, errors) */
  messages: string[]

  /** Cost in credits (0 = free) */
  cost: number

  /** Variable name if output= was used */
  output?: string

  /** The value stored (for debugging) */
  value?: any
}
