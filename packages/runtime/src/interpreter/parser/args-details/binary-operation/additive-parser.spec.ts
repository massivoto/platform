import { describe, it, expect } from 'vitest'

import {
  GenlexTracer,
  SingleParser,
  Stream,
  TracingGenLex,
} from '@masala/parser'
import { BinaryExpressionNode } from '../../ast.js'
import { additiveParser } from './additive-parser.js'
import { buildMultiplicativeParser } from './multiplicative-parser.js'

let tracer: GenlexTracer
function buildAdditiveParserForTests(): SingleParser<BinaryExpressionNode> {
  const genlex = new TracingGenLex()
  tracer = genlex.tracer
  const { multiplicative, tokens } = buildMultiplicativeParser(genlex)
  const grammar = additiveParser(tokens, multiplicative)
  return genlex.use(grammar)
}

describe('Additive parser', () => {
  const additiveGrammar = buildAdditiveParserForTests()

  it('should parse an addition expression with priority', () => {
    let stream = Stream.ofChars('3 + 10 * 5')
    let parsing = additiveGrammar.parse(stream)

    let logs = tracer.flushForAi()
    // writeParserLogs(logs)
    expect(parsing.isAccepted()).toBe(true)
    let expected: BinaryExpressionNode = {
      type: 'binary',
      operator: '+',
      left: { type: 'literal-number', value: 3 },
      right: {
        type: 'binary',
        operator: '*',
        left: { type: 'literal-number', value: 10 },
        right: { type: 'literal-number', value: 5 },
      },
    }
    expect(parsing.value).toEqual(expected)

    stream = Stream.ofChars('3 * 10 + 5')
    parsing = additiveGrammar.parse(stream)

    logs = tracer.flushForAi()
    // writeParserLogs(logs)
    expect(parsing.isAccepted()).toBe(true)
    expected = {
      type: 'binary',
      operator: '+',
      left: {
        type: 'binary',
        operator: '*',
        left: { type: 'literal-number', value: 3 },
        right: { type: 'literal-number', value: 10 },
      },
      right: { type: 'literal-number', value: 5 },
    }
    expect(parsing.value).toEqual(expected)
  })

  it('should parse an addition expression with unary and number', () => {
    const stream = Stream.ofChars('-3 + 10')
    const parsing = additiveGrammar.parse(stream)

    const logs = tracer.flushForAi()
    // writeParserLogs(logs)
    expect(parsing.isAccepted()).toBe(true)
    const expected: BinaryExpressionNode = {
      type: 'binary',
      operator: '+',
      left: {
        type: 'unary',
        operator: '-',
        argument: { type: 'literal-number', value: 3 },
      },
      right: { type: 'literal-number', value: 10 },
    }
    expect(parsing.value).toEqual(expected)
  })

  it('should parse a complex expression', () => {
    const stream = Stream.ofChars('3 + 5 * 2 - 8 / 4')
    const parsing = additiveGrammar.parse(stream)

    const logs = tracer.flushForAi()
    // writeParserLogs(logs)
    expect(parsing.isAccepted()).toBe(true)
    const expected: BinaryExpressionNode = {
      type: 'binary',
      operator: '-',
      left: {
        type: 'binary',
        operator: '+',
        left: { type: 'literal-number', value: 3 },
        right: {
          type: 'binary',
          operator: '*',
          left: { type: 'literal-number', value: 5 },
          right: { type: 'literal-number', value: 2 },
        },
      },
      right: {
        type: 'binary',
        operator: '/',
        left: { type: 'literal-number', value: 8 },
        right: { type: 'literal-number', value: 4 },
      },
    }
    expect(parsing.value).toEqual(expected)
  })
})
