import { ScopeChain } from './scope'
import { SerializableStorePointer, StoreProvider } from './store'
import { AppletLauncher } from '../applets'
import { SerializableObject } from '../network'
import { ReadableDate } from '../time'

/**
 * Execution status for tracking program state.
 * R-CONFIRM-122
 */
export type ExecutionStatus =
  | 'running'
  | 'waitingHumanValidation'
  | 'finished'
  | 'error'

export interface ExecutionContext {
  env: Record<string, string> // will not be saved nor shared
  data: SerializableObject
  scopeChain: ScopeChain // block-local variables (forEach iterator, etc.)
  extra: any
  meta: {
    tool?: string
    updatedAt: ReadableDate
  }
  user: {
    id: string
    extra: SerializableObject
  }
  store: SerializableStorePointer
  storeProvider?: StoreProvider // Optional async store provider for store.x lookups
  prompts: string[]

  // R-CONFIRM-121: User-facing logs for program output
  userLogs: string[]

  // R-CONFIRM-122: Program execution status
  status: ExecutionStatus

  // R-CONFIRM-123: Applet launcher for human validation (v0.5)
  appletLauncher?: AppletLauncher
}
