export interface ActionResult<T> {
  success: boolean
  value?: T // If success and pertinent, the value returned by the action
  fatalError?: string
  messages: string[]
  message?: string // Optional message for the action
  cost: number // cost in credits (handler reports its cost)
}
