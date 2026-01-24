import type { IGenLex } from '@masala/parser/typings/genlex.js'
import { describe, it, expect } from 'vitest'

import {
  createTracer,
  GenLex,
  SingleParser,
  Stream,
  TracingGenLex,
} from '@masala/parser'
import { ExpressionNode, LiteralNumberNode } from '../../../ast.js'
import { createArgumentTokens } from '../../tokens/argument-tokens.js'
import {
  createBasicBinaryParser,
  createSeriesOfNumberParser,
} from './basic-binary-operation-parser.js'

function buildBasicBinaryParserForTests(): SingleParser<ExpressionNode> {
  const genlex = new TracingGenLex()
  const tokens = createArgumentTokens(genlex)
  const grammar = createBasicBinaryParser(tokens)
  return genlex.use(grammar)
}

function buildMinimalParserForTests(): SingleParser<LiteralNumberNode> {
  const genlex: IGenLex = new GenLex()
  const tokens = createArgumentTokens(genlex)
  const grammar = createSeriesOfNumberParser(tokens)
  return genlex.use(grammar)
}

describe('minimal parser', () => {
  const parser = buildMinimalParserForTests()

  it('parses a single number', () => {
    const input = '42'
    const stream = Stream.ofChars(input)
    const res = parser.parse(stream)

    expect(res.isAccepted()).toBe(true)
    expect(res.value).toEqual({ type: 'literal-number', value: 42 })
  })

  it('parses multiple number', () => {
    const input = '12 345 6789 20'
    const stream = Stream.ofChars(input)
    const res = parser.parse(stream)

    expect(res.isAccepted()).toBe(true)
    expect(res.value).toEqual({ type: 'literal-number', value: 20 })
  })
})
