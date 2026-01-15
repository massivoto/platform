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

import { C, SingleParser } from '@masala/parser'
import { CommandNode } from '../ast.js'
import { identifier } from '../shared-parser.js'

/**
 * Build a standalone command parser using character-level combinators (NO GenLex).
 * This ensures commands like "@pkg/ name" with internal spaces are rejected,
 * because character-level parsing doesn't skip whitespace.
 *
 * Grammar: @package/function(/function)*
 * - Must start with @
 * - Must have at least one segment after package (e.g., @pkg/cmd)
 * - No spaces allowed anywhere inside the command
 */
export function buildCommandParser(): SingleParser<CommandNode> {
  const at = C.char('@')
  const slash = C.char('/')

  // @package
  const packagePart = at.drop().then(identifier)

  // /function (at least one required)
  const segment = slash.drop().then(identifier)

  const command: SingleParser<CommandNode> = packagePart
    .then(segment.rep())
    .map((t) => {
      const parts = t.array() as string[]
      const pack = parts[0]
      const name = parts[parts.length - 1]

      return {
        type: 'command',
        package: pack,
        name,
        path: parts,
      }
    })

  return command
}
