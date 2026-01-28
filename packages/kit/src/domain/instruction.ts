import { Serializable } from '../network'

export type InstructionState =
  | 'waiting'
  | 'executing'
  | 'skipped'
  | 'succeed'
  | 'failed'

export interface Instruction extends Serializable {
  instruction: string
  state: InstructionState
  repeat: boolean
  condition: boolean
  streamed: boolean
}
