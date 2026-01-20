/**
 * Parser for building regular arguments in an instruction.
 * Reserved arguments (output=, if=) are handled in instruction-parser.ts
 */

import { SingleParser } from '@masala/parser'
import { MixedTuple } from '@masala/parser/typings/tuple.js'
import { createExpressionWithPipe } from './args-details/full-expression-parser.js'
import { ArgTokens } from './args-details/tokens/argument-tokens.js'

import { ArgumentNode, IdentifierNode, LiteralNode } from './ast.js'

export function createArgGrammar(
  tokens: ArgTokens,
): SingleParser<ArgumentNode> {
  const { IS, IDENTIFIER } = tokens

  const expression = createExpressionWithPipe(tokens)

  const arg = IDENTIFIER.then(IS.drop()).then(expression)

  return arg
    .map((tuple: MixedTuple<IdentifierNode, LiteralNode | IdentifierNode>) => ({
      name: tuple.first().value,
      valueNode: tuple.last(),
    }))
    .map(argMapper)
}

function argMapper(argData: {
  name: string
  valueNode: LiteralNode | IdentifierNode
}): ArgumentNode {
  const argNode: ArgumentNode = {
    type: 'argument',
    name: { type: 'identifier', value: argData.name },
    value: argData.valueNode,
  }
  return argNode
}
