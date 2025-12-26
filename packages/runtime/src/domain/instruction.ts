import { Serializable } from '@massivoto/kit'

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
