import { F, SingleParser, Tuple } from '@masala/parser'
import { ExpressionNode } from '../../../ast.js'
import { chainLeft } from '../../../chain-left/chain-left.js'
import { ArgTokens } from '../../tokens/argument-tokens.js'

// ArgTokens is assumed to expose the listed token parsers.
export function createFullExpressionParser(
  tokens: ArgTokens,
): SingleParser<ExpressionNode> {
  const {
    NOT,
    PLUS,
    MINUS,
    MULTIPLY,
    DIV,
    MODULO,
    LT,
    LTE,
    GT,
    GTE,
    EQ,
    NEQ,
    AND,
    OR,
    IDENTIFIER,
    NUMBER,
    STRING,
    BOOLEAN,
    LEFT,
    RIGHT,
  } = tokens

  // Top-level expression (set later)
  const EXPRESSION: SingleParser<ExpressionNode> = F.lazy(() => LOGICAL_OR)

  const PAREN = LEFT.drop()
    .then(EXPRESSION)
    .then(RIGHT.drop())
    .map((t: Tuple<ExpressionNode>) =>
      t.first(),
    ) as SingleParser<ExpressionNode>

  const PRIMARY = F.tryAll([PAREN, NUMBER, STRING, BOOLEAN, IDENTIFIER])

  // ---- Unary: only '!' (prefix). Allow multiple (!!x) and fold right. ----
  const UNARY = NOT.optrep()
    .then(PRIMARY)
    .map((t) => {
      const node = t.last()
      const ops = t.array().slice(0, -1) // all but last
      return ops
        .slice()
        .reverse()
        .reduce<ExpressionNode>(
          (acc) => ({ type: 'unary', operator: '!', argument: acc }),
          node,
        )
    })

  // ---- Binary precedence ladder (all left-associative) ----
  const MULTIPLICATIVE = chainLeft(
    UNARY,
    MULTIPLY.or(DIV).or(MODULO),
    (op, left, right) => ({
      type: 'binary',
      operator: op as '*' | '/' | '%',
      left,
      right,
    }),
  )

  const ADDITIVE = chainLeft(
    MULTIPLICATIVE,
    PLUS.or(MINUS),
    (op, left, right) => ({
      type: 'binary',
      operator: op as '+' | '-',
      left,
      right,
    }),
  )

  const COMPARISON = chainLeft(
    ADDITIVE,
    LT.or(LTE).or(GT).or(GTE),
    (op, left, right) => ({
      type: 'binary',
      operator: op as '<' | '<=' | '>' | '>=',
      left,
      right,
    }),
  )

  const EQUALITY = chainLeft(COMPARISON, EQ.or(NEQ), (op, left, right) => ({
    type: 'binary',
    operator: op as '==' | '!=',
    left,
    right,
  }))

  const LOGICAL_AND = chainLeft(EQUALITY, AND, (_op, left, right) => ({
    type: 'logical',
    operator: '&&',
    left,
    right,
  }))

  const LOGICAL_OR = chainLeft(LOGICAL_AND, OR, (_op, left, right) => ({
    type: 'logical',
    operator: '||',
    left,
    right,
  }))

  return EXPRESSION
}
