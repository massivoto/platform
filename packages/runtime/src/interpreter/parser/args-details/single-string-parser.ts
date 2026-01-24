import { identifier } from '../shared-parser.js'
import { SingleStringNode } from '../ast.js'

/**
 * SingleStringParser parses an unquoted literal string.
 *
 * Uses the same pattern as identifier but produces a SingleStringNode
 * instead of IdentifierNode. This distinction is semantic:
 * - IdentifierNode: evaluator looks up the value in context
 * - SingleStringNode: evaluator uses the literal string value
 *
 * Same rules apply:
 * - Pattern: [a-zA-Z_][a-zA-Z0-9_-]*
 * - No trailing hyphen
 * - No reserved words (true, false, if, output, etc.)
 * - No dots (parser stops before dot)
 *
 * Used by mapper expressions: `users -> name` where `name` is a SingleString
 */
export const singleStringParser = identifier.map(
  (value): SingleStringNode => ({
    type: 'single-string',
    value,
  }),
)
