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
import { equalityParser } from './equality-parser.js'
import { buildMultiplicativeParser } from './multiplicative-parser.js'

let tracer: GenlexTracer
function buildEqualityParserForTests(): SingleParser<BinaryExpressionNode> {
  const genlex = new TracingGenLex()
  tracer = genlex.tracer
  const { multiplicative, tokens } = buildMultiplicativeParser(genlex)
  const additive = additiveParser(tokens, multiplicative)
  const comparative = comparativeParser(tokens, additive)
  const grammar = equalityParser(tokens, comparative)
  return genlex.use(grammar)
}

describe('Equality parser', () => {
  const equalityGrammar = buildEqualityParserForTests()

  it('should parse an equality expression with priority', () => {
    let stream = Stream.ofChars('3 + 10 * 5 == 20 - 5')
    let parsing = equalityGrammar.thenEos().parse(stream)
    let logs = tracer.flushForAi()
    // writeParserLogs(logs)
    expect(parsing.isAccepted()).toBe(true)
    let expected: BinaryExpressionNode = {
      type: 'binary',
      operator: '==',
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

    stream = Stream.ofChars('3 * 10 + 5 != 50 / 2')
    parsing = equalityGrammar.thenEos().parse(stream)
    logs = tracer.flushForAi()
    // writeParserLogs(logs)
    expect(parsing.isAccepted()).toBe(true)
    expected = {
      type: 'binary',
      operator: '!=',
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
})
