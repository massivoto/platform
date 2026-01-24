import {
  GenlexTracer,
  leanToken,
  N,
  SingleParser,
  Stream,
  TracingGenLex,
} from '@masala/parser'
import { describe, it, expect } from 'vitest'
import { ExpressionNode, LiteralNumberNode } from '../ast.js'
import {
  BinaryOperator,
  chainLeft,
  headAndRightHandSideParser,
} from './chain-left.js'

let tracer: GenlexTracer
export function buildHeadAndRhsParser(): SingleParser<Array<number | string>> {
  const genlex = new TracingGenLex()
  const [ADD] = genlex.keywords(['+']).flatMap((t) => t.map(leanToken))
  const number: SingleParser<number> = genlex
    .tokenize(N.number(), 'number', 2000) // + is prior to +3.14
    .map(leanToken)
  const grammar = headAndRightHandSideParser(number, ADD)
  tracer = genlex.tracer
  return genlex.use(grammar)
}

export function buildChainLeftAdditionParser(): SingleParser<ExpressionNode> {
  const genlex = new TracingGenLex()
  const [ADD] = genlex
    .keywords(['+'])
    .flatMap((t) => t.map(leanToken)) as Array<SingleParser<BinaryOperator>>
  const number: SingleParser<LiteralNumberNode> = genlex
    .tokenize(N.number(), 'number', 2000) // + is prior to +3.14
    .map((t) => ({
      type: 'literal-number',
      value: t.value,
    }))
  const grammar = chainLeft(number, ADD, (op, left, right) => ({
    type: 'binary',
    operator: op as '*' | '/',
    left,
    right,
  }))
  tracer = genlex.tracer
  return genlex.use(grammar)
}

describe('Head and Rhs parser', () => {
  const parser = buildHeadAndRhsParser()
  it('should parse and return an array', () => {
    const stream = Stream.ofChars('4+3+2+5')
    const res = parser.thenEos().parse(stream)
    expect(res.isAccepted()).toBe(true)
    const array = res.value.first()
    expect(Array.isArray(array)).toBeTruthy()
  })

  it('should not parse with other op', () => {
    const stream = Stream.ofChars('4+3*2+5')
    const res = parser.thenEos().parse(stream)
    expect(res.isAccepted()).toBe(false)
  })

  it('should NOT parse number with (+) prefix', () => {
    const stream = Stream.ofChars('4++3')
    const res = parser.thenEos().parse(stream)
    expect(res.isAccepted()).toBe(false)
  })

  it('should parse with spaces in between', () => {
    const stream = Stream.ofChars('  4 +   3 + 2   +5 ')
    const res = parser.thenEos().parse(stream)
    expect(res.isAccepted()).toBe(true)
    const array = res.value.first()
    expect(array).toEqual([4, '+', 3, '+', 2, '+', 5])
  })
})

describe('ChainLeft with only additions', () => {
  it('should parse left-associative chains (1+2+3)', () => {
    const parser = buildChainLeftAdditionParser()
    const stream = Stream.ofChars('1 + 2+3')
    const res = parser.thenEos().parse(stream)
    const value = res.value.first()
    const expected: ExpressionNode = {
      type: 'binary',
      operator: '+',
      left: {
        type: 'binary',
        operator: '+',
        left: { type: 'literal-number', value: 1 },
        right: { type: 'literal-number', value: 2 },
      },
      right: { type: 'literal-number', value: 3 },
    }

    expect(res.isAccepted()).toBe(true)
    expect(value).toEqual(expected)
  })
})
