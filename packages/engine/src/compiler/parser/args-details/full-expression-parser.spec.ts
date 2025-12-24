import { describe, it, expect } from 'vitest'

import {
  GenlexTracer,
  SingleParser,
  Stream,
  TracingGenLex,
} from '@masala/parser'
import { ExpressionNode } from '../ast.js'
import { createExpressionWithPipe } from './full-expression-parser.js'
import { createArgumentTokens } from './tokens/argument-tokens.js'

let tracer: GenlexTracer
function buildFullExpressionParserForTests(): SingleParser<ExpressionNode> {
  const genlex = new TracingGenLex()
  tracer = genlex.tracer
  const tokens = createArgumentTokens(genlex)
  const grammar = createExpressionWithPipe(tokens)
  return genlex.use(grammar)
}

describe('Expression parser', () => {
  const expressionGrammar = buildFullExpressionParserForTests()

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

  it('should parse a  logical expression', () => {
    const stream = Stream.ofChars('10 > 5 && 2 < 4')
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
        left: { type: 'literal-number', value: 2 },
        right: { type: 'literal-number', value: 4 },
      },
    }
    expect(parsing.value).toEqual(expected)
  })

  it('should not parse a  pipe expression as simple expression member', () => {
    const stream = Stream.ofChars('{2|pipeName} && 2 < 4')
    const parsing = expressionGrammar.thenEos().parse(stream)

    expect(parsing.isAccepted()).toBe(false)
  })

  it('should accept simple expression in a pipe', () => {
    let stream = Stream.ofChars('{x && 2 < 4|pipeName} ')
    let parsing = expressionGrammar.thenEos().parse(stream)
    expect(parsing.isAccepted()).toBe(true)

    stream = Stream.ofChars('{x && 2 < 4|pipeName:(2+2)} ')
    parsing = expressionGrammar.thenEos().parse(stream)
    expect(parsing.isAccepted()).toBe(true)
  })

  it('Pipes do NOT have members', () => {
    let stream = Stream.ofChars('{x && 2 < 4|pipeName}.member ')
    let parsing = expressionGrammar.thenEos().parse(stream)
    expect(parsing.isAccepted()).toBe(false)
  })
})
