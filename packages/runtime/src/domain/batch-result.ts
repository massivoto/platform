import type { ActionLog } from './action-log.js'

/**
 * BatchResult - Aggregation of Actions for a Block, Template, or any grouping.
 *
 * Part of the marketing-friendly result hierarchy:
 * - ProgramResult (program-level)
 * - BatchResult (batch-level aggregation)
 * - ActionLog (action-level)
 *
 * A "Batch" is a marketing term for any grouping of Actions:
 * - Blocks: `{ ... }` grouping
 * - Templates: reusable action sequences
 * - ForEach iterations: each iteration is a batch
 *
 * @example
 * ```typescript
 * const batch: BatchResult = {
 *   success: true,
 *   message: "Block 'init' completed",
 *   actions: [
 *     { command: '@utils/set', success: true, ... },
 *     { command: '@utils/log', success: true, ... },
 *   ],
 *   totalCost: 0,
 *   duration: 15,
 * }
 * ```
 */
export interface BatchResult {
  /** Whether all actions in the batch succeeded */
  success: boolean

  /** Batch-level message describing the grouping, e.g., "Block 'init' completed" */
  message: string

  /** Per-action execution logs */
  actions: ActionLog[]

  /** Sum of action costs in this batch */
  totalCost: number

  /** Total duration in milliseconds for this batch */
  duration: number
}
