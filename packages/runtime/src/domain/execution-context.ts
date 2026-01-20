import { SerializableObject, ReadableDate } from '@massivoto/kit'

import { fakeStorePointer, SerializableStorePointer } from './store.js'

export interface ExecutionContext {
  env: Record<string, string> // will not be saved nor shared
  data: SerializableObject
  extra: any
  meta: {
    tool?: string
    history: InstructionLog[]
    updatedAt: ReadableDate
  }
  user: {
    id: string
    extra: SerializableObject
  }
  store: SerializableStorePointer
  prompts: string[]
  cost: {
    current: number // current cost in cents
    estimated: number // estimated cost in cents
    maximum: number // maximum cost allowed by the user for this run
    credits: number // credits available for the user
  }
}

export interface InstructionLog {
  command: string // e.g. '@utils/set'
  success: boolean
  fatalError?: string
  start: ReadableDate
  end: ReadableDate
  duration: number // in milliseconds
  messages: string[] // error stack, warnings, info messages
  cost: number // cost in credits (0 = free)
  output?: string // variable name if output= was used
  value?: any // the value stored (for debugging)
}

export function createEmptyExecutionContext(
  userId: string,
  extra: SerializableObject = {},
): ExecutionContext {
  return {
    env: {},
    data: {},
    extra,
    meta: {
      tool: undefined,
      history: [],
      updatedAt: new Date().toISOString(),
    },
    user: {
      id: userId,
      extra: {},
    },
    store: fakeStorePointer(),
    prompts: [],

    cost: {
      current: 0,
      estimated: 0,
      maximum: -1, // <0 means no limit
      credits: 0,
    },
  }
}

export function cloneExecutionContext(
  context: ExecutionContext,
): ExecutionContext {
  return {
    env: { ...context.env },
    data: { ...context.data },
    extra: structuredClone(context.extra),
    meta: {
      tool: context.meta.tool,
      history: [...context.meta.history],
      updatedAt: context.meta.updatedAt,
    },
    user: {
      id: context.user.id,
      extra: structuredClone(context.user.extra),
    },
    store: structuredClone(context.store),
    prompts: [...context.prompts],
    cost: {
      current: context.cost.current,
      estimated: context.cost.estimated,
      maximum: context.cost.maximum,
      credits: context.cost.credits,
    },
  }
}

export function fromPartialContext(
  partialContext: Partial<ExecutionContext>,
): ExecutionContext {
  const emptyContext = createEmptyExecutionContext(
    partialContext.user?.id || 'unknown',
    partialContext.extra || {},
  )
  return {
    env: { ...partialContext.env },
    data: { ...partialContext.data },
    extra: structuredClone(partialContext.extra),
    meta: {
      tool: partialContext.meta?.tool || emptyContext.meta.tool,
      history: [...(partialContext.meta?.history || emptyContext.meta.history)],
      updatedAt: partialContext.meta?.updatedAt || emptyContext.meta.updatedAt,
    },
    user: {
      id: partialContext.user?.id || emptyContext.user.id,
      extra: structuredClone(
        partialContext.user?.extra || emptyContext.user.extra,
      ),
    },
    store: structuredClone(partialContext.store || emptyContext.store),
    prompts: [...(partialContext.prompts || emptyContext.prompts)],
    cost: {
      current: partialContext.cost?.current || emptyContext.cost.current,
      estimated: partialContext.cost?.estimated || emptyContext.cost.estimated,
      maximum: partialContext.cost?.maximum || emptyContext.cost.maximum,
      credits: partialContext.cost?.credits || emptyContext.cost.credits,
    },
  }
}
