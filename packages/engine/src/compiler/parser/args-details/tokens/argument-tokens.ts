import { IGenLex, SingleParser, leanToken } from '@masala/parser'
import {
  IdentifierNode,
  LiteralBooleanNode,
  LiteralNumberNode,
  LiteralStringNode,
} from '../../ast.js'

import {
  booleanLiteral,
  identifier,
  numberLiteral,
  stringLiteral,
} from '../../shared-parser.js'

export interface UnaryTokens {
  NOT: SingleParser<'!'>
  PLUS: SingleParser<'+'>
  MINUS: SingleParser<'-'>
  IDENTIFIER: SingleParser<IdentifierNode>
  NUMBER: SingleParser<LiteralNumberNode>
  STRING: SingleParser<LiteralStringNode>
  //SINGLE_STRING: SingleParser<LiteralStringNode>
  BOOLEAN: SingleParser<LiteralBooleanNode>
  // PIPE_EXPRESSION: SingleParser<(string | number | boolean)[]>
}

// Question: should we have
// NUMBER_LITERAL: SingleParser<number>
// or NUMBER_LITERAL: SingleParser<LiteralNode> ?
export interface ArgTokens extends UnaryTokens {
  /*
  // PIPE_EXPRESSION: SingleParser<(string | number | boolean)[]>
  NOT: SingleParser<'!'>
  PLUS: SingleParser<'+'>
  MINUS: SingleParser<'-'>*/
  MULTIPLY: SingleParser<'*'>
  DIV: SingleParser<'/'>
  MODULO: SingleParser<'%'>

  LT: SingleParser<'<'>
  LTE: SingleParser<'<='>
  GT: SingleParser<'>'>
  GTE: SingleParser<'>='>

  IS: SingleParser<'='>

  EQ: SingleParser<'=='>
  NEQ: SingleParser<'!='>

  AND: SingleParser<'&&'>
  OR: SingleParser<'||'>
  //

  LEFT: SingleParser<'('>
  RIGHT: SingleParser<')'>
  OPEN: SingleParser<'{'>
  CLOSE: SingleParser<'}'>
  PIPE: SingleParser<'|>'>
  COLON: SingleParser<':'>
  COMMA: SingleParser<','>
  DOT: SingleParser<'.'>
  //EQUALITY_OP: Token<'==' | '!='>
  // ADDITION_OPS: SingleParser<'+' | '-'>
  // MULTIPLY_OPS: SingleParser<'*' | '/' | '%'>
  // COMPARISON_OP: SingleParser<'<' | '<=' | '>' | '>='>
  //LOGICAL_OP: Token<'&&' | '||'>
  //PARENTHESES: Token<'(' | ')'>
}

export function createArgumentTokens(genlex: IGenLex): ArgTokens {
  const [PLUS, MINUS, MULTIPLY, DIV, MODULO] = genlex.keywords([
    '+',
    '-',
    '*',
    '/',
    '%',
  ])
  const [AND, OR] = genlex.keywords(['&&', '||'])
  const [LEFT, RIGHT, OPEN, CLOSE] = genlex.keywords(['(', ')', '{', '}'])
  const [COLON, COMMA, DOT] = genlex.keywords([':', ',', '.'])
  const PIPE = genlex.tokenize('|', 'PIPE', 1200)

  const NOT = genlex.tokenize('!', 'NOT', 500)
  const NEQ = genlex.tokenize('!=', 'NEQ', 300)
  const EQ = genlex.tokenize('==', 'EQ', 1000)
  const IS = genlex.tokenize('=', 'IS', 1100)

  const LT = genlex.tokenize('<', 'LT', 1000)
  const LTE = genlex.tokenize('<=', 'LTE', 500)
  const GT = genlex.tokenize('>', 'GT', 1000)
  const GTE = genlex.tokenize('>=', 'GTE', 500)

  // Number must have a lower priority than '+' and '-'
  const IDENTIFIER = genlex.tokenize(identifier, 'IDENTIFIER', 1000)
  const STRING_LITERAL = genlex.tokenize(stringLiteral, 'STRING_LITERAL', 2000)
  const NUMBER_LITERAL = genlex.tokenize(numberLiteral, 'NUMBER_LITERAL', 2000)
  const BOOLEAN_LITERAL = genlex.tokenize(
    booleanLiteral,
    'BOOLEAN_LITERAL',
    1500,
  ) // true can be confused with IDENTIFIER 'true', but identifier don't accept reserved words

  /*const PIPE_EXPRESSION = genlex.tokenize(
    pipeExpression,
    'PIPE_EXPRESSION',
    5000,
  )*/
  return {
    NOT: NOT.map(leanToken) as SingleParser<'!'>,
    PLUS: PLUS.map(leanToken) as SingleParser<'+'>,
    MINUS: MINUS.map(leanToken) as SingleParser<'-'>,
    IDENTIFIER: IDENTIFIER.map(leanToken).map((v) => ({
      type: 'identifier',
      value: v,
    })),
    STRING: STRING_LITERAL.map(leanToken).map((v: string) => ({
      type: 'literal-string',
      value: v.slice(1, -1),
    })),

    NUMBER: NUMBER_LITERAL.map(leanToken).map((v) => ({
      type: 'literal-number',
      value: v,
    })),
    BOOLEAN: BOOLEAN_LITERAL.map(leanToken).map((v: boolean) => ({
      type: 'literal-boolean',
      value: v,
    })),
    MULTIPLY: MULTIPLY.map(leanToken) as SingleParser<'*'>,
    DIV: DIV.map(leanToken) as SingleParser<'/'>,
    MODULO: MODULO.map(leanToken) as SingleParser<'%'>,
    LT: LT.map(leanToken) as SingleParser<'<'>,
    LTE: LTE.map(leanToken) as SingleParser<'<='>,
    GT: GT.map(leanToken) as SingleParser<'>'>,
    GTE: GTE.map(leanToken) as SingleParser<'>='>,
    IS: IS.map(leanToken) as SingleParser<'='>,
    EQ: EQ.map(leanToken) as SingleParser<'=='>,
    NEQ: NEQ.map(leanToken) as SingleParser<'!='>,
    AND: AND.map(leanToken) as SingleParser<'&&'>,
    OR: OR.map(leanToken) as SingleParser<'||'>,
    LEFT: LEFT.map(leanToken) as SingleParser<'('>,
    RIGHT: RIGHT.map(leanToken) as SingleParser<')'>,
    OPEN: OPEN.map(leanToken) as SingleParser<'{'>,
    CLOSE: CLOSE.map(leanToken) as SingleParser<'}'>,
    PIPE: PIPE.map(leanToken) as SingleParser<'|>'>,
    COLON: COLON.map(leanToken) as SingleParser<':'>,
    COMMA: COMMA.map(leanToken) as SingleParser<','>,
    DOT: DOT.map(leanToken) as SingleParser<'.'>,
  }
}
