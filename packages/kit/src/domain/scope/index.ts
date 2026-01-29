export type { ScopeChain } from './scope.js'
export {
  createEmptyScopeChain,
  pushScope,
  popScope,
  write,
  cloneScopeChain,
  lookup,
} from './scope-chain.js'
