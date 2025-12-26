import { describe, it, expect } from 'vitest'
import {
  GenLex,
  SingleParser,
  Stream,
  TracingGenLex,
  GenlexTracer,
} from '@masala/parser'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  BinaryExpressionNode,
  ExpressionNode,
  UnaryExpressionNode,
} from '../../ast.js'
import { buildMultiplicativeParser } from '../binary-operation/multiplicative-parser.js'
import { createArgumentTokens } from '../tokens/argument-tokens.js'
import { atomicParser } from '../tokens/literals-parser.js'
import { createPostfixParser } from './member-parser.js'
import { unaryParser } from './unary-parser.js'

let tracer: GenlexTracer
export function buildUnaryParserForTests(): SingleParser<UnaryExpressionNode> {
  const genlex = new TracingGenLex()
  tracer = genlex.tracer
  const tokens = createArgumentTokens(genlex)
  const primary: SingleParser<ExpressionNode> = atomicParser(tokens)
  const postfix = createPostfixParser(tokens, primary)
  const grammar = unaryParser(tokens, postfix)
  return genlex.use(grammar)
}

export function buildUnaryWithMemberParserForTests(): SingleParser<UnaryExpressionNode> {
  const genlex = new GenLex()
  const tokens = createArgumentTokens(genlex)
  const primary: SingleParser<ExpressionNode> = atomicParser(tokens)
  const grammar = unaryParser(tokens, primary)
  return genlex.use(grammar)
}

describe('Unary parser', () => {
  const unaryGrammar = buildUnaryParserForTests()

  it('should opposite a number argument', () => {
    const stream = Stream.ofChars('-10')
    const parsing = unaryGrammar.parse(stream)

    expect(parsing.isAccepted()).toBe(true)
    const expected: UnaryExpressionNode = {
      type: 'unary',
      operator: '-',
      argument: {
        type: 'literal-number',
        value: 10,
      },
    }
    expect(parsing.value).toEqual(expected)
  })

  it('should accept a leading plus on a number', () => {
    const stream = Stream.ofChars('+10')
    const parsing = unaryGrammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    const expected: UnaryExpressionNode = {
      type: 'unary',
      operator: '+',
      argument: { type: 'literal-number', value: 10 },
    }
    expect(parsing.value).toEqual(expected)
  })

  it('should negate an identifier', () => {
    const stream = Stream.ofChars('-count')
    const parsing = unaryGrammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    const expected: UnaryExpressionNode = {
      type: 'unary',
      operator: '-',
      argument: { type: 'identifier', value: 'count' },
    }
    expect(parsing.value).toEqual(expected)
  })

  it('should logical-not an identifier', () => {
    const stream = Stream.ofChars('!flag')
    const parsing = unaryGrammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    const expected: UnaryExpressionNode = {
      type: 'unary',
      operator: '!',
      argument: { type: 'identifier', value: 'flag' },
    }
    expect(parsing.value).toEqual(expected)
  })

  it.skip('should handle multiple unary operators (double not)', () => {
    const stream = Stream.ofChars('!!flag')
    const parsing = unaryGrammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    const expected: UnaryExpressionNode = {
      type: 'unary',
      operator: '!',
      argument: {
        type: 'unary',
        operator: '!',
        argument: { type: 'identifier', value: 'flag' },
      },
    }
    expect(parsing.value).toEqual(expected)
  })

  it.skip('should handle mixed unary operators (! followed by -)', () => {
    const stream = Stream.ofChars('!-10')
    const parsing = unaryGrammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    const expected: UnaryExpressionNode = {
      type: 'unary',
      operator: '!',
      argument: {
        type: 'unary',
        operator: '-',
        argument: { type: 'literal-number', value: 10 },
      },
    }
    expect(parsing.value).toEqual(expected)
  })

  it('should ignore extra whitespace between operator and operand', () => {
    const stream = Stream.ofChars('-   10')
    const parsing = unaryGrammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    const expected: UnaryExpressionNode = {
      type: 'unary',
      operator: '-',
      argument: { type: 'literal-number', value: 10 },
    }
    expect(parsing.value).toEqual(expected)
  })

  it('works with members like -obj.prop', () => {})
})
