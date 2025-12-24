import { GenlexTracer, Stream, TracingGenLex } from '@masala/parser'
import { describe, it, expect } from 'vitest'
import { writeParserLogs } from '../../../debug/write-parser-logs.js'
import { createSimpleExpressionWithParenthesesParser } from '../simple-expression-parser.js'
import { createArgumentTokens } from '../tokens/argument-tokens.js'
import { createPipeParser } from './pipe-parser.js'

let tracer: GenlexTracer

function createPipeGrammar() {
  const genlex = new TracingGenLex()
  const tokens = createArgumentTokens(genlex)
  tracer = genlex.tracer
  const expressionParser = createSimpleExpressionWithParenthesesParser(tokens)
  const pipeParser = createPipeParser(tokens, expressionParser)
  return genlex.use(pipeParser)
}

describe('Pipe parser', () => {
  const pipeGrammar = createPipeGrammar()

  it('should parse a simple pipe expression', () => {
    const stream = Stream.ofChars('{value | pipe1:arg1:arg2 | pipe2}')
    const parsing = pipeGrammar.parse(stream)

    const logs = tracer.flushForAi()
    expect(parsing.isAccepted()).toBe(true)
    const expected = {
      type: 'pipe-expression',
      input: {
        type: 'identifier',
        value: 'value',
      },
      segments: [
        {
          pipeName: 'pipe1',
          args: [
            { type: 'identifier', value: 'arg1' },
            { type: 'identifier', value: 'arg2' },
          ],
        },
        {
          pipeName: 'pipe2',
          args: [],
        },
      ],
    }
    expect(parsing.value).toEqual(expected)
  })

  it('should parse a dense pipe expression', () => {
    const stream = Stream.ofChars('{value|pipe1|pipe2}')
    const parsing = pipeGrammar.parse(stream)

    const logs = tracer.flushForAi()
    expect(parsing.isAccepted()).toBe(true)
    const expected = {
      type: 'pipe-expression',
      input: {
        type: 'identifier',
        value: 'value',
      },
      segments: [
        {
          pipeName: 'pipe1',
          args: [],
        },
        {
          pipeName: 'pipe2',
          args: [],
        },
      ],
    }
    expect(parsing.value).toEqual(expected)
  })

  it('should parse a pipe expression with nested expressions', () => {
    const stream = Stream.ofChars('{(a + b) | sum}')
    const parsing = pipeGrammar.parse(stream)

    const logs = tracer.flushForAi()
    expect(parsing.isAccepted()).toBe(true)
    const expected = {
      type: 'pipe-expression',
      input: {
        type: 'binary',
        operator: '+',
        left: { type: 'identifier', value: 'a' },
        right: { type: 'identifier', value: 'b' },
      },
      segments: [
        {
          pipeName: 'sum',
          args: [],
        },
      ],
    }
    expect(parsing.value).toEqual(expected)
  })

  it('should parse a pipe expression with nested expressions', () => {
    const stream = Stream.ofChars('{a + b*2 | sum}')
    const parsing = pipeGrammar.parse(stream)

    const logs = tracer.flushForAi()
    expect(parsing.isAccepted()).toBe(true)

    const expected = {
      type: 'pipe-expression',
      input: {
        type: 'binary',
        operator: '+',
        left: { type: 'identifier', value: 'a' },
        right: {
          type: 'binary',
          operator: '*',
          left: { type: 'identifier', value: 'b' },
          right: { type: 'literal-number', value: 2 },
        },
      },
      segments: [
        {
          pipeName: 'sum',
          args: [],
        },
      ],
    }

    expect(parsing.value).toEqual(expected)
  })
  it('should NOT parse an almost pipe expression', () => {
    const stream = Stream.ofChars('{value}')
    const parsing = pipeGrammar.parse(stream)

    expect(parsing.isAccepted()).toBe(false)
  })

  it('do not parse a really empty pipe expression', () => {
    let stream = Stream.ofChars('{}')
    let parsing = pipeGrammar.parse(stream)
    expect(parsing.isAccepted()).toBe(false)

    stream = Stream.ofChars('{ | }')
    parsing = pipeGrammar.parse(stream)
    expect(parsing.isAccepted()).toBe(false)

    stream = Stream.ofChars('{ | pipe1 }')
    parsing = pipeGrammar.parse(stream)
    expect(parsing.isAccepted()).toBe(false)

    stream = Stream.ofChars('{ value | }')
    parsing = pipeGrammar.parse(stream)
    expect(parsing.isAccepted()).toBe(false)

    stream = Stream.ofChars('{ | pipe1:arg1 }')
    parsing = pipeGrammar.parse(stream)
    expect(parsing.isAccepted()).toBe(false)

    stream = Stream.ofChars('{ value | pipe1: }')
    parsing = pipeGrammar.parse(stream)
    expect(parsing.isAccepted()).toBe(false)

    stream = Stream.ofChars('{ value | pipe1:arg1 | }')
    parsing = pipeGrammar.parse(stream)
    expect(parsing.isAccepted()).toBe(false)

    stream = Stream.ofChars('{ | pipe1:arg1 | pipe2 }')
    parsing = pipeGrammar.parse(stream)
    expect(parsing.isAccepted()).toBe(false)
  })
})
