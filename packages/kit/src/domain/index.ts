export type { ExecutionContext, ExecutionStatus } from './execution-context/index.js'
export { ScopeChain } from './scope/index.js'
export type { ActionLog } from './action-log.js'

export type { BatchResult } from './runtime/batch-result.js'

export type { Flow } from './flow.js'

export type { Instruction } from './instruction.js'

export type { ProgramResult, CostInfo } from './runtime/program-result.js'
export {
  createNormalCompletion,
  createEarlyExit,
  createReturn,
} from './runtime/program-result.js'

export type {
  FlowControl,
  LabelLocation,
  EnhancedLabelIndex,
  StatementResult,
  InstructionOutcome,
  OutputTarget,
  Interpreter,
} from './runtime/Interpreter.js'
export { parseOutputTarget } from './runtime/Interpreter.js'

export type { SerializableStorePointer, StoreProvider } from './store.js'
export { fakeStorePointer } from './store.js'

export * from './execution-context/index.js'
export * from './scope/index.js'
export * from './command/index.js'

export type { FileReference } from './file-reference.js'
export { isFileReference, resolveFilePath } from './file-reference.js'

export type {
  AiProvider,
  AiProviderName,
  TextRequest,
  TextResult,
  ImageRequest,
  ImageResult,
  ImageAnalysisRequest,
  ImageAnalysisResult,
} from './ai-provider.js'
export { DEFAULT_AI_PROVIDER } from './ai-provider.js'
