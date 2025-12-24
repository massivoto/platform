import { F, SingleParser } from '@masala/parser'
import { AtomicNode } from '../../ast.js'
import { ArgTokens } from './argument-tokens.js'

export function atomicParser(tokens: ArgTokens): SingleParser<AtomicNode> {
  const { IDENTIFIER, STRING, NUMBER, BOOLEAN } = tokens

  // Order matters only if tokens overlap; otherwise tryAll is fine
  let ATOMS = F.tryAll([IDENTIFIER, BOOLEAN, STRING, NUMBER])

  return ATOMS // This is *primary* leaf set (no parentheses yet)
}
