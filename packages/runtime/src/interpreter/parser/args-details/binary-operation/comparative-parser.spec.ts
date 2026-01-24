import { describe, it, expect } from 'vitest'

import {
  GenlexTracer,
  SingleParser,
  Stream,
  TracingGenLex,
} from '@masala/parser'
import { BinaryExpressionNode } from '../../ast.js'
import { additiveParser } from './additive-parser.js'
import { comparativeParser } from './comparative-parser.js'
import { buildMultiplicativeParser } from './multiplicative-parser.js'

let tracer: GenlexTracer
function buildComparativeParserForTests(): SingleParser<BinaryExpressionNode> {
  const genlex = new TracingGenLex()
  tracer = genlex.tracer
  const { multiplicative, tokens } = buildMultiplicativeParser(genlex)
  const additive = additiveParser(tokens, multiplicative)
  const grammar = comparativeParser(tokens, additive)
  return genlex.use(grammar)
}

describe('Comparative parser', () => {
  const comparativeGrammar = buildComparativeParserForTests()

  it('should parse a comparative expression with priority', () => {
    let stream = Stream.ofChars('3 + 10 * 5 >= 20 - 5')
    let parsing = comparativeGrammar.thenEos().parse(stream)
    let logs = tracer.flushForAi()
    // writeParserLogs(logs)
    expect(parsing.isAccepted()).toBe(true)
    let expected: BinaryExpressionNode = {
      type: 'binary',
      operator: '>=',
      left: {
        type: 'binary',
        operator: '+',
        left: { type: 'literal-number', value: 3 },
        right: {
          type: 'binary',
          operator: '*',
          left: { type: 'literal-number', value: 10 },
          right: { type: 'literal-number', value: 5 },
        },
      },
      right: {
        type: 'binary',
        operator: '-',
        left: { type: 'literal-number', value: 20 },
        right: { type: 'literal-number', value: 5 },
      },
    }
    expect(parsing.value.first()).toEqual(expected)

    stream = Stream.ofChars('3 * 10 + 5 < 50 / 2')
    parsing = comparativeGrammar.thenEos().parse(stream)
    logs = tracer.flushForAi()
    // writeParserLogs(logs)
    expect(parsing.isAccepted()).toBe(true)
    expected = {
      type: 'binary',
      operator: '<',
      left: {
        type: 'binary',
        operator: '+',
        left: {
          type: 'binary',
          operator: '*',
          left: { type: 'literal-number', value: 3 },
          right: { type: 'literal-number', value: 10 },
        },
        right: { type: 'literal-number', value: 5 },
      },
      right: {
        type: 'binary',
        operator: '/',
        left: { type: 'literal-number', value: 50 },
        right: { type: 'literal-number', value: 2 },
      },
    }
    expect(parsing.value.first()).toEqual(expected)
  })

  it('should parse a comparative expression with unary and number', () => {
    const stream = Stream.ofChars('-3 + 10 >= 5')
    const parsing = comparativeGrammar.thenEos().parse(stream)

    const logs = tracer.flushForAi()
    // writeParserLogs(logs)
    expect(parsing.isAccepted()).toBe(true)
    const expected: BinaryExpressionNode = {
      type: 'binary',
      operator: '>=',
      left: {
        type: 'binary',
        operator: '+',
        left: {
          type: 'unary',
          operator: '-',
          argument: { type: 'literal-number', value: 3 },
        },
        right: { type: 'literal-number', value: 10 },
      },
      right: { type: 'literal-number', value: 5 },
    }
    expect(parsing.value.first()).toEqual(expected)
  })
})
