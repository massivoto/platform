import { ScopeChain } from '../scope/index.js'
import { SerializableStorePointer, StoreProvider } from '../store.js'
import { AppletLauncher } from '../../applets/index.js'
import { SerializableObject } from '../../network/index.js'
import { ReadableDate } from '../../time/index.js'
import type { AiProvider, AiProviderConfig } from '../ai-provider.js'
import type { HandlerConfig } from '../handler-config.js'

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

  // R-FILE-81: File system configuration for file access
  fileSystem?: {
    projectRoot: string
  }

  // R-AIC-62: Validated AI provider config loaded from env at startup
  aiConfig?: AiProviderConfig

  // R-HC-13: Handler configuration loaded from massivoto.config.json
  handlerConfig?: HandlerConfig

  // R-PAR-03: Resolved AI provider injected by interpreter before handler.run()
  resolvedProvider?: AiProvider
}
