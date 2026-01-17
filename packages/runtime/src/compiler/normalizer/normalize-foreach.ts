// normalizeForEach.ts
import { ForEachNode, IdentifierNode, InstructionNode } from '../parser/ast.js'

// forEachParsing.ts
export class ForEachParseError extends Error {
  constructor(spec: string) {
    super(
      `Invalid forEach syntax: ${JSON.stringify(spec)}. Expected: "item of items"`,
    )
    this.name = 'ForEachParseError'
  }
}

/**
 * Parses Angular-style spec strings like: "item of items".
 * For now we only accept identifiers on both sides.
 * Swap this out with a Masala Parser later for richer RHS (e.g., member access).
 */
export function parseForEachSpec(spec: string): {
  iterator: IdentifierNode
  iterable: IdentifierNode
} {
  const m = /^\s*([A-Za-z_]\w*)\s+of\s+([A-Za-z_]\w*)\s*$/.exec(spec)
  if (!m) throw new ForEachParseError(spec)
  const [, iter, iterbl] = m
  return {
    iterator: { type: 'identifier', value: iter },
    iterable: { type: 'identifier', value: iterbl }, // TODO: widen to ExpressionNode if needed
  }
}

export function normalizeForEach(
  node: InstructionNode,
): InstructionNode | ForEachNode {
  if (!node.args?.length) return node

  const idx = node.args.findIndex(
    (a) =>
      a.type === 'argument' &&
      a.name.type === 'identifier' &&
      a.name.value === 'forEach',
  )
  if (idx === -1) return node

  const arg = node.args[idx]
  if (arg.value.type !== 'literal-string') {
    throw new ForEachParseError(String((arg as any)?.value?.value ?? ''))
  }

  const { iterator, iterable } = parseForEachSpec(arg.value.value)

  // Remove reserved arg immutably
  const newArgs = node.args.toSpliced(idx, 1) // use spread+slice if ES2023 isn't available

  const body: InstructionNode = {
    type: 'instruction',
    action: node.action,
    args: newArgs,
    output: node.output,
  }

  const forEachNode: ForEachNode = {
    type: 'forEach',
    iterator,
    iterable,
    body,
  }

  return forEachNode
}
