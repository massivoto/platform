import { SerializableObject, ReadableDate } from '@massivoto/kit'

import {
  fakeStorePointer,
  SerializableStorePointer,
  StoreProvider,
} from './store.js'
import {
  ScopeChain,
  createEmptyScopeChain,
  cloneScopeChain,
} from '../interpreter/evaluator/scope-chain.js'

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
}

export function createEmptyExecutionContext(
  userId: string,
  extra: SerializableObject = {},
): ExecutionContext {
  return {
    env: {},
    data: {},
    scopeChain: createEmptyScopeChain(),
    extra,
    meta: {
      tool: undefined,
      updatedAt: new Date().toISOString(),
    },
    user: {
      id: userId,
      extra: {},
    },
    store: fakeStorePointer(),
    prompts: [],
  }
}

export function cloneExecutionContext(
  context: ExecutionContext,
): ExecutionContext {
  return {
    env: { ...context.env },
    data: { ...context.data },
    scopeChain: cloneScopeChain(context.scopeChain),
    extra: structuredClone(context.extra),
    meta: {
      tool: context.meta.tool,
      updatedAt: context.meta.updatedAt,
    },
    user: {
      id: context.user.id,
      extra: structuredClone(context.user.extra),
    },
    store: structuredClone(context.store),
    storeProvider: context.storeProvider, // StoreProvider is not cloned (stateful service)
    prompts: [...context.prompts],
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
    scopeChain: partialContext.scopeChain
      ? cloneScopeChain(partialContext.scopeChain)
      : emptyContext.scopeChain,
    extra: structuredClone(partialContext.extra),
    meta: {
      tool: partialContext.meta?.tool || emptyContext.meta.tool,
      updatedAt: partialContext.meta?.updatedAt || emptyContext.meta.updatedAt,
    },
    user: {
      id: partialContext.user?.id || emptyContext.user.id,
      extra: structuredClone(
        partialContext.user?.extra || emptyContext.user.extra,
      ),
    },
    store: structuredClone(partialContext.store || emptyContext.store),
    storeProvider: partialContext.storeProvider, // StoreProvider is not cloned (stateful service)
    prompts: [...(partialContext.prompts || emptyContext.prompts)],
  }
}
