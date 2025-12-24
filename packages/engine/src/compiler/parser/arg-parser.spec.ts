import { describe, it, expect } from 'vitest'
import {
  GenLex,
  GenlexTracer,
  SingleParser,
  Stream,
  TracingGenLex,
} from '@masala/parser'
import { writeParserLogs } from '../debug/write-parser-logs.js'
import { createArgGrammar } from './arg-parser.js'
import { createArgumentTokens } from './args-details/tokens/argument-tokens.js'
import { ArgumentNode } from './ast.js'

let tracer: GenlexTracer

function buildArgParserForTests(): SingleParser<ArgumentNode> {
  const genlex = new TracingGenLex()
  tracer = genlex.tracer
  const tokens = createArgumentTokens(genlex)
  const grammar = createArgGrammar(tokens)
  return genlex.use(grammar)
}

describe('Genlex for arg parser', () => {
  const grammar = buildArgParserForTests()

  it('should accept a simple argument', () => {
    const stream = Stream.ofChars('arg1 = val1')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({
      type: 'argument',
      name: { type: 'identifier', value: 'arg1' },
      value: { type: 'identifier', value: 'val1' },
    })
  })

  it('should accept a literal string argument', () => {
    const stream = Stream.ofChars('arg1 = "val1"')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({
      type: 'argument',
      name: { type: 'identifier', value: 'arg1' },
      value: { type: 'literal-string', value: 'val1' },
    })
  })

  it('should accept a  string  argument', () => {
    const stream = Stream.ofChars('arg1 = "10asString" ')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({
      type: 'argument',
      name: { type: 'identifier', value: 'arg1' },
      value: { type: 'literal-string', value: '10asString' },
    })
  })

  it('should accept a number argument', () => {
    const stream = Stream.ofChars('arg1 = 10')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({
      type: 'argument',
      name: { type: 'identifier', value: 'arg1' },
      value: { type: 'literal-number', value: 10 },
    })
  })

  it('should accept a number argument kept as string', () => {
    const stream = Stream.ofChars('arg1 = "10" ')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({
      type: 'argument',
      name: { type: 'identifier', value: 'arg1' },
      value: { type: 'literal-string', value: '10' },
    })
  })
})

describe('It should accept a pipe expression', () => {
  it('should accept a pipe expression with no call', () => {
    let stream = Stream.ofChars(`input = {tweets|pipeName}`)
    let parsing = buildArgParserForTests().parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({
      type: 'argument',
      name: { type: 'identifier', value: 'input' },
      value: {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'tweets' },
        segments: [{ pipeName: 'pipeName', args: [] }],
      },
    })
  })

  it('should accept a pipe expression with a call and argument', () => {
    let stream = Stream.ofChars(`input = {tweets|reverse:3}`)
    let parsing = buildArgParserForTests().parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({
      type: 'argument',
      name: { type: 'identifier', value: 'input' },
      value: {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'tweets' },
        segments: [
          {
            pipeName: 'reverse',
            args: [
              {
                type: 'literal-number',
                value: 3,
              },
            ],
          },
        ],
      },
    })
  })
})
