/**
 *
 * Parser for building the AST part of args in an action
 * @tweeter/users  ids={tweets:mappedBy:id} output = users
 *
 * @tweeter/users is the action
 * Some actions will not use @package, but it's like a syntaxic sugar
 * and we could add that default package at the start of the line
 * if that line don't start with @
 *
 * For rich domains, or improving a domain, we authorize subsets
 * @seo/kw/cluster is a subset of @seo/kw to avoid @seo/kw type="...."
 * @seo/kw will also be registered as a full action
 *
 * @seo is the package
 *
 */

import { C, F, SingleParser } from '@masala/parser'
import { ActionNode } from '../ast.js'

/**
 * Identifier pattern for action segments.
 * Unlike the standard identifier parser, this allows reserved words
 * so that commands like @flow/return work correctly.
 * Action paths are not expressions - they're just strings.
 */
const actionSegment = F.regex(/[a-zA-Z_][a-zA-Z0-9_-]*/).filter(
  (s) => s.charAt(s.length - 1) !== '-',
)

/**
 * Build a standalone action parser using character-level combinators (NO GenLex).
 * This ensures actions like "@pkg/ name" with internal spaces are rejected,
 * because character-level parsing doesn't skip whitespace.
 *
 * Grammar: @package/function(/function)*
 * - Must start with @
 * - Must have at least one segment after package (e.g., @pkg/cmd)
 * - No spaces allowed anywhere inside the action
 * - Reserved words ARE allowed in action segments (e.g., @flow/return)
 */
export function buildActionParser(): SingleParser<ActionNode> {
  const at = C.char('@')
  const slash = C.char('/')

  // @package
  const packagePart = at.drop().then(actionSegment)

  // /function (at least one required)
  const segment = slash.drop().then(actionSegment)

  const action: SingleParser<ActionNode> = packagePart
    .then(segment.rep())
    .map((t) => {
      const parts = t.array() as string[]
      const pack = parts[0]
      const name = parts[parts.length - 1]

      return {
        type: 'action',
        package: pack,
        name,
        path: parts,
      }
    })

  return action
}
