import { ScopeChain } from '../../../../kit/src/domain';
/**
 * Creates an empty root scope chain with no parent.
 */
export declare function createEmptyScopeChain(): ScopeChain;
/**
 * Creates a new child scope with the given scope as parent.
 * Used when entering a forEach block.
 *
 * @param chain - The current scope to become the parent
 * @returns A new child scope with empty current and the given parent
 */
export declare function pushScope(chain: ScopeChain): ScopeChain;
/**
 * Returns to the parent scope, discarding the current scope.
 * Used when exiting a forEach block.
 *
 * @param chain - The current scope to pop
 * @returns The parent scope
 * @throws Error if trying to pop the root scope (no parent)
 */
export declare function popScope(chain: ScopeChain): ScopeChain;
/**
 * Looks up a variable by walking the scope chain from current to root.
 * Returns the first match found, or undefined if not found anywhere.
 *
 * @param name - The variable name to look up
 * @param chain - The scope chain to search
 * @returns The value if found, undefined otherwise
 */
export declare function lookup(name: string, chain: ScopeChain): any;
/**
 * Writes a variable to the current scope only.
 * Does NOT walk up the chain - always writes to the innermost scope.
 *
 * @param name - The variable name to write
 * @param value - The value to store
 * @param chain - The scope chain (writes to chain.current)
 */
export declare function write(name: string, value: any, chain: ScopeChain): void;
/**
 * Deep clones the entire scope chain.
 * Used by cloneExecutionContext to preserve immutability.
 *
 * @param chain - The scope chain to clone
 * @returns A new independent scope chain with the same values
 */
export declare function cloneScopeChain(chain: ScopeChain): ScopeChain;
//# sourceMappingURL=scope-chain.d.ts.map