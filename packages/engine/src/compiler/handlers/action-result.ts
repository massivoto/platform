import { InstructionLog } from '../../domain/execution-context.js'

export interface ActionResult<T> {
  success: boolean
  value?: T // If success and pertinent, the value returned by the action
  output?: string // path of the state variable affected by the action
  fatalError?: string
  log: InstructionLog
  messages: string[]
  message?: string // Optional message for the action
}
