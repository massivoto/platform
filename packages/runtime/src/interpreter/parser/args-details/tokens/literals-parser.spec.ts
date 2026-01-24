import { describe, it, expect } from 'vitest'
import { GenLex, SingleParser, Stream } from '@masala/parser'
import { AtomicNode } from '../../ast.js'
import { createArgumentTokens } from './argument-tokens.js'
import { atomicParser } from './literals-parser.js'

export function buildParserForTests(): SingleParser<AtomicNode> {
  const genlex = new GenLex()
  const tokens = createArgumentTokens(genlex)
  const grammar = atomicParser(tokens)
  return genlex.use(grammar)
}

describe('Atomic parser', () => {
  const grammar = buildParserForTests()

  it('should accept an id argument', () => {
    const stream = Stream.ofChars('id')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({
      type: 'identifier',
      value: 'id',
    })
  })

  it('should accept an id argument, thought starts like true', () => {
    const stream = Stream.ofChars('tryThis')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({
      type: 'identifier',
      value: 'tryThis',
    })
  })

  it('should accept an id argument, thought it starts WITH true', () => {
    const stream = Stream.ofChars('trueMan')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({
      type: 'identifier',
      value: 'trueMan',
    })
  })

  it('should accept a number argument', () => {
    const stream = Stream.ofChars('10')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({ type: 'literal-number', value: 10 })
  })

  it('should accept a number argument kept as string', () => {
    const stream = Stream.ofChars('"10"')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({ type: 'literal-string', value: '10' })
  })

  it('should accept a boolean true', () => {
    const stream = Stream.ofChars('true')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({ type: 'literal-boolean', value: true })
  })

  it('should accept a boolean false', () => {
    const stream = Stream.ofChars('false')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({ type: 'literal-boolean', value: false })
  })

  it('should keep quoted boolean "true" as string', () => {
    const stream = Stream.ofChars('"true"')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({ type: 'literal-string', value: 'true' })
  })

  it('should keep quoted boolean "false" as string', () => {
    const stream = Stream.ofChars('"false"')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({ type: 'literal-string', value: 'false' })
  })

  it('should treat capitalized True as identifier (case-sensitive)', () => {
    const stream = Stream.ofChars('True')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({ type: 'identifier', value: 'True' })
  })

  it('should treat identifiers starting with true as identifier', () => {
    const stream = Stream.ofChars('trueValue')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({
      type: 'identifier',
      value: 'trueValue',
    })
  })

  it('should treat falsey as identifier, not boolean', () => {
    const stream = Stream.ofChars('falsey')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({ type: 'identifier', value: 'falsey' })
  })
})

describe('String escape sequences', () => {
  const grammar = buildParserForTests()

  it('should parse escaped double quote', () => {
    const stream = Stream.ofChars('"say \\"hello\\""')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({
      type: 'literal-string',
      value: 'say "hello"',
    })
  })

  it('should parse escaped backslash', () => {
    const stream = Stream.ofChars('"C:\\\\Users\\\\name"')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({
      type: 'literal-string',
      value: 'C:\\Users\\name',
    })
  })

  it('should parse escaped newline', () => {
    const stream = Stream.ofChars('"line1\\nline2"')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({
      type: 'literal-string',
      value: 'line1\nline2',
    })
  })

  it('should parse escaped tab', () => {
    const stream = Stream.ofChars('"col1\\tcol2"')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({
      type: 'literal-string',
      value: 'col1\tcol2',
    })
  })

  it('should parse mixed escapes', () => {
    const stream = Stream.ofChars('"line1\\nline2\\t\\"quoted\\""')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({
      type: 'literal-string',
      value: 'line1\nline2\t"quoted"',
    })
  })
})
