import { describe, it, expect } from 'vitest'

import {
  GenlexTracer,
  SingleParser,
  Stream,
  TracingGenLex,
} from '@masala/parser'
import { ExpressionNode } from '../ast.js'
import { createSimpleExpressionWithParenthesesParser } from './simple-expression-parser.js'
import { createArgumentTokens } from './tokens/argument-tokens.js'

let tracer: GenlexTracer
function buildSimpleExpressionParserForTests(): SingleParser<ExpressionNode> {
  const genlex = new TracingGenLex()
  tracer = genlex.tracer
  const tokens = createArgumentTokens(genlex)
  const grammar = createSimpleExpressionWithParenthesesParser(tokens)
  return genlex.use(grammar)
}

describe('Expression parser', () => {
  const expressionGrammar = buildSimpleExpressionParserForTests()

  it('should parse a simple number', () => {
    const stream = Stream.ofChars('10')
    const parsing = expressionGrammar.parse(stream)

    expect(parsing.isAccepted()).toBe(true)
    const expected: ExpressionNode = {
      type: 'literal-number',
      value: 10,
    }
    expect(parsing.value).toEqual(expected)
  })

  it('should parse a simple multiplication', () => {
    const stream = Stream.ofChars('10 * 5')
    const parsing = expressionGrammar.parse(stream)

    expect(parsing.isAccepted()).toBe(true)
    const expected: ExpressionNode = {
      type: 'binary',
      operator: '*',
      left: { type: 'literal-number', value: 10 },
      right: { type: 'literal-number', value: 5 },
    }
    expect(parsing.value).toEqual(expected)
  })

  it('should parse a simple addition', () => {
    const stream = Stream.ofChars('10 + 5')
    const parsing = expressionGrammar.parse(stream)

    expect(parsing.isAccepted()).toBe(true)
    const expected: ExpressionNode = {
      type: 'binary',
      operator: '+',
      left: { type: 'literal-number', value: 10 },
      right: { type: 'literal-number', value: 5 },
    }
    expect(parsing.value).toEqual(expected)
  })

  it('should parse a  logical expression', () => {
    const stream = Stream.ofChars('10 > 5 && 3 < 4')
    const parsing = expressionGrammar.parse(stream)

    expect(parsing.isAccepted()).toBe(true)
    const expected: ExpressionNode = {
      type: 'logical',
      operator: '&&',
      left: {
        type: 'binary',
        operator: '>',
        left: { type: 'literal-number', value: 10 },
        right: { type: 'literal-number', value: 5 },
      },
      right: {
        type: 'binary',
        operator: '<',
        left: { type: 'literal-number', value: 3 },
        right: { type: 'literal-number', value: 4 },
      },
    }
    expect(parsing.value).toEqual(expected)
  })
})

describe('Expression parser with parentheses', () => {
  const expressionGrammar = buildSimpleExpressionParserForTests()
  it('should parse a  simple number with parentheses', () => {
    const stream = Stream.ofChars('(10)')
    const parsing = expressionGrammar.parse(stream)

    expect(parsing.isAccepted()).toBe(true)
    const expected: ExpressionNode = {
      type: 'literal-number',
      value: 10,
    }
    expect(parsing.value).toEqual(expected)
  })
})

describe('A multiplicative parser can parse only a single number', () => {
  const expressionGrammar = buildSimpleExpressionParserForTests()

  it('should parse a single number', () => {
    const stream = Stream.ofChars('10')
    const parsing = expressionGrammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)

    expect(parsing.value).toEqual({
      type: 'literal-number',
      value: 10,
    })
  })

  it('should parse a mathematical expression ', () => {
    const stream = Stream.ofChars('10 * 5 + (3 / (2 - 4))')
    const parsing = expressionGrammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)

    expect(parsing.value).toEqual({
      type: 'binary',
      operator: '+',
      left: {
        type: 'binary',
        operator: '*',
        left: { type: 'literal-number', value: 10 },
        right: { type: 'literal-number', value: 5 },
      },
      right: {
        type: 'binary',
        operator: '/',
        left: { type: 'literal-number', value: 3 },
        right: {
          type: 'binary',
          operator: '-',
          left: { type: 'literal-number', value: 2 },
          right: { type: 'literal-number', value: 4 },
        },
      },
    })
  })

  it('should parse a complex logical expression ', () => {
    const stream = Stream.ofChars('10 > 5 && (3 < 4 || 2 == 2)')
    const parsing = expressionGrammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)

    expect(parsing.value).toEqual({
      type: 'logical',
      operator: '&&',
      left: {
        type: 'binary',
        operator: '>',
        left: { type: 'literal-number', value: 10 },
        right: { type: 'literal-number', value: 5 },
      },
      right: {
        type: 'logical',
        operator: '||',
        left: {
          type: 'binary',
          operator: '<',
          left: { type: 'literal-number', value: 3 },
          right: { type: 'literal-number', value: 4 },
        },
        right: {
          type: 'binary',
          operator: '==',
          left: { type: 'literal-number', value: 2 },
          right: { type: 'literal-number', value: 2 },
        },
      },
    })
  })
})
