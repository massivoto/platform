/**
 * Creates an empty root scope chain with no parent.
 */
export function createEmptyScopeChain() {
    return { current: {} };
}
/**
 * Creates a new child scope with the given scope as parent.
 * Used when entering a forEach block.
 *
 * @param chain - The current scope to become the parent
 * @returns A new child scope with empty current and the given parent
 */
export function pushScope(chain) {
    return { current: {}, parent: chain };
}
/**
 * Returns to the parent scope, discarding the current scope.
 * Used when exiting a forEach block.
 *
 * @param chain - The current scope to pop
 * @returns The parent scope
 * @throws Error if trying to pop the root scope (no parent)
 */
export function popScope(chain) {
    if (!chain.parent) {
        throw new Error('Cannot pop root scope');
    }
    return chain.parent;
}
/**
 * Looks up a variable by walking the scope chain from current to root.
 * Returns the first match found, or undefined if not found anywhere.
 *
 * @param name - The variable name to look up
 * @param chain - The scope chain to search
 * @returns The value if found, undefined otherwise
 */
export function lookup(name, chain) {
    // Check current scope first
    if (name in chain.current) {
        return chain.current[name];
    }
    // Walk up to parent if exists
    if (chain.parent) {
        return lookup(name, chain.parent);
    }
    // Not found in entire chain
    return undefined;
}
/**
 * Writes a variable to the current scope only.
 * Does NOT walk up the chain - always writes to the innermost scope.
 *
 * @param name - The variable name to write
 * @param value - The value to store
 * @param chain - The scope chain (writes to chain.current)
 */
export function write(name, value, chain) {
    chain.current[name] = value;
}
/**
 * Deep clones the entire scope chain.
 * Used by cloneExecutionContext to preserve immutability.
 *
 * @param chain - The scope chain to clone
 * @returns A new independent scope chain with the same values
 */
export function cloneScopeChain(chain) {
    const cloned = {
        current: structuredClone(chain.current),
    };
    if (chain.parent) {
        cloned.parent = cloneScopeChain(chain.parent);
    }
    return cloned;
}
//# sourceMappingURL=scope-chain.js.map