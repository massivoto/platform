import { Instruction } from './instruction.js'

export interface Flow {
  id: string
  userId: string
  name: string
  instructions: Instruction[]
  currentInstructionIndex: number
  isRunning: boolean
  isPaused: boolean
  successfulCompletions: number
  errors: string[]
}
