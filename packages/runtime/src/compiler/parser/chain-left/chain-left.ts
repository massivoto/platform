import { C, MixedParser, SingleParser } from '@masala/parser'
import {
  BinaryExpressionNode,
  ExpressionNode,
  LiteralNumberNode,
  LogicalExpressionNode,
} from '../ast.js'

function spaces() {
  return C.charIn(' \r\n\f\t').optrep().drop()
}

const cancelSpacing = true
function spacing<T>(p: SingleParser<T>): SingleParser<T> {
  // Especially for debug and test purposes, we want to disable spacing
  if (cancelSpacing) {
    return p
  }
  return spaces()
    .drop()
    .then(p)
    .then(spaces().drop())
    .map((t) => t.single())
}

/**
 * Parses a left-hand side term followed by zero or more pairs of (operator, term).
 * Head (term) followed by right-hand side terms with operators in between.
 * Returns an array of the form: [head, op1, rhs1, op2, rhs2, ...]
 * such as [1, '+', 2, '-', 3]
 *
 * @param term : typically a number
 * @param op : typically an operator like +, -, etc.
 * @returns Array of terms and operators
 */
export function headAndRightHandSideParser<T>(
  term: SingleParser<T>,
  op: SingleParser<string>,
): SingleParser<Array<T | string>> {
  // Parse head + 0..n pairs
  const head = spacing(term)
  //TODO: I think we don't care about spacing. Handled by Genlex
  const pair: MixedParser<string, T> = spacing(op).then(spacing(term))

  const pairs = pair.optrep()
  return head.then(pairs).map((t) => t.array())
}

export type BinaryType = 'logical' | 'binary' | 'conditional'
export type BinaryOperator =
  | '||'
  | '&&'
  | '=='
  | '!='
  | '<'
  | '<='
  | '>'
  | '>='
  | '+'
  | '-'
  | '*'
  | '/'
  | '%'

export type MakeNode = (
  op: BinaryOperator,
  left: ExpressionNode,
  right: ExpressionNode,
) => BinaryExpressionNode | LogicalExpressionNode

export function chainLeft(
  term: SingleParser<ExpressionNode>,
  op: SingleParser<BinaryOperator>,
  makeNode: MakeNode,
): SingleParser<ExpressionNode> {
  // Parse head + 0..n pairs
  const headAndRhsParser = headAndRightHandSideParser(term, op)

  return headAndRhsParser.map((flat) => {
    let acc = flat[0] as ExpressionNode
    // Iterate pairs and build a left associative tree
    for (let i = 1; i < flat.length; i += 2) {
      const operator = flat[i] as BinaryOperator
      const rhs = flat[i + 1] as ExpressionNode
      acc = makeNode(operator, acc, rhs)
    }
    return acc
  })
}

export const makeBinaryNode: MakeNode = (
  op: BinaryOperator,
  left: ExpressionNode,
  right: ExpressionNode,
) => {
  return {
    type: 'binary' as const,
    operator: op,
    left,
    right,
  } as BinaryExpressionNode
}

export const makeLogicalNode: MakeNode = (
  op: BinaryOperator,
  left: ExpressionNode,
  right: ExpressionNode,
) => {
  return {
    type: 'logical' as const,
    operator: op,
    left,
    right,
  } as LogicalExpressionNode
}
