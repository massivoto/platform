import { describe, it, expect } from 'vitest'

import {
  GenlexTracer,
  SingleParser,
  Stream,
  TracingGenLex,
} from '@masala/parser'
import { BinaryExpressionNode, LogicalExpressionNode } from '../../ast.js'
import { additiveParser } from './additive-parser.js'
import { comparativeParser } from './comparative-parser.js'
import { equalityParser } from './equality-parser.js'
import { logicalAndParser, logicalOrParser } from './logical-parser.js'
import { buildMultiplicativeParser } from './multiplicative-parser.js'
import { writeParserLogs } from '../../../debug/write-parser-logs.js'

let tracer: GenlexTracer
function buildLogicalParserForTests(): SingleParser<BinaryExpressionNode> {
  const genlex = new TracingGenLex()
  tracer = genlex.tracer
  const { multiplicative, tokens } = buildMultiplicativeParser(genlex)
  const additive = additiveParser(tokens, multiplicative)
  const comparative = comparativeParser(tokens, additive)
  const equality = equalityParser(tokens, comparative)
  const logicalAnd = logicalAndParser(tokens, equality)
  const grammar = logicalOrParser(tokens, logicalAnd)
  return genlex.use(grammar)
}

describe('Logical parser', () => {
  const logicalGrammar = buildLogicalParserForTests()
  it('should parse a logical expression with priority', () => {
    let stream = Stream.ofChars(' !x == a && true')
    let parsing = logicalGrammar.thenEos().parse(stream)
    let logs = tracer.flushForAi()
    writeParserLogs(logs)
    expect(parsing.isAccepted()).toBe(true)
    let expected: LogicalExpressionNode = {
      type: 'logical',
      operator: '&&',
      left: {
        type: 'binary',
        operator: '==',
        left: {
          type: 'unary',
          operator: '!',
          argument: { type: 'identifier', value: 'x' },
        },
        right: { type: 'identifier', value: 'a' },
      },
      right: { type: 'literal-boolean', value: true },
    }
    expect(parsing.value.first()).toEqual(expected)

    stream = Stream.ofChars('false || a != b + 10 * 5')
    parsing = logicalGrammar.thenEos().parse(stream)
    logs = tracer.flushForAi()
    // writeParserLogs(logs)
    expect(parsing.isAccepted()).toBe(true)
    expected = {
      type: 'logical',
      operator: '||',
      left: { type: 'literal-boolean', value: false },
      right: {
        type: 'binary',
        operator: '!=',
        left: { type: 'identifier', value: 'a' },
        right: {
          type: 'binary',
          operator: '+',
          left: { type: 'identifier', value: 'b' },
          right: {
            type: 'binary',
            operator: '*',
            left: { type: 'literal-number', value: 10 },
            right: { type: 'literal-number', value: 5 },
          },
        },
      },
    }
    expect(parsing.value.first()).toEqual(expected)
  })
})
