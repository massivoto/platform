/**
 * Scope Chain for Variable Resolution
 *
 * Provides lexical scoping for variables within block structures like forEach.
 * Variables in child scopes shadow those in parent scopes.
 *
 * @example
 * ```typescript
 * const root = createEmptyScopeChain()
 * write('user', 'Emma', root)
 *
 * const child = pushScope(root)
 * write('tweet', 'Hello!', child)
 *
 * lookup('user', child)  // 'Emma' (walks up to parent)
 * lookup('tweet', child) // 'Hello!'
 * lookup('tweet', root)  // undefined
 * ```
 */

/**
 * A scope chain node with a current scope and optional parent link.
 * Forms a linked list from innermost to outermost scope.
 */
export interface ScopeChain {
  /** Variables in the current scope level */
  current: Record<string, any>
  /** Link to parent scope (undefined for root scope) */
  parent?: ScopeChain
}
