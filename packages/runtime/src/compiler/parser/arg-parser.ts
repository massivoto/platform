/**
 *
 * Parser for building the AST part of  args in a command line
 * @tweeter/users  ids={tweets:mappedBy:id} output = users
 *
 * ids={tweets:mappedBy:id} and output = users  are both args
 *
 * So left is
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

  const unfilteredParser = arg
    .map((tuple: MixedTuple<IdentifierNode, LiteralNode | IdentifierNode>) => ({
      name: tuple.first().value,
      valueNode: tuple.last(),
    }))
    .map(argMapper)

  /**
   * For the moment, the grammar accepts only output as identifier
   * ie: output = users or output = tweets
   * but not output = "users" or output = {tweets}
   */
  return filterOutputType(unfilteredParser)
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

function filterOutputType(
  parser: SingleParser<ArgumentNode>,
): SingleParser<ArgumentNode> {
  return parser.filter((arg) => {
    if (arg.type === 'argument' && arg.name.value === 'output') {
      return arg.value.type === 'identifier'
    }
    return true
  })
}
