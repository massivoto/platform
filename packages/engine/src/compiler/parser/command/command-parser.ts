/**
 *
 * Parser for building the AST part of  args in a command line
 * @tweeter/users  ids={tweets:mappedBy:id} output = users
 *
 * @tweeter/users is the command
 * Some command will not use @package, but it's like a syntaxic sugar
 * and we could add that default package at the start of the line
 * if that line don't start with @
 *
 * For rich domains, or improving a domain, we authorize subsets
 * @seo/kw/cluster is a subset of @seo/kw to avoid @seo/kw type="...."
 * @seo/kw will also be registered as a full command
 *
 * @seo is the package
 *
 */

import { SingleParser } from '@masala/parser'
import { CommandNode } from '../ast.js'
import { CommandTokens } from './command-tokens.js'

export function createCommandGrammar(
  tokens: CommandTokens,
): SingleParser<CommandNode> {
  const { AT, SLASH, PACKAGE, FUNCTION } = tokens

  const _package = AT.drop().then(PACKAGE).first()

  const segment = SLASH.drop().then(FUNCTION).first()

  const command: SingleParser<CommandNode> = _package
    .then(segment.rep())
    .map((t) => {
      const pack = t.first()
      const name = t.last()
      const path = t.array()

      return {
        type: 'command',
        package: pack,
        name,
        path,
      }
    })

  return command
}
