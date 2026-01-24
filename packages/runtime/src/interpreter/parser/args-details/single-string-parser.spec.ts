import { describe, it, expect } from 'vitest'
import { Stream } from '@masala/parser'
import { SingleStringNode } from '../ast.js'
import { singleStringParser } from './single-string-parser.js'

describe('SingleString parser', () => {
  // AC-SS-01: Simple identifier produces SingleStringNode
  it('should parse a simple identifier as SingleStringNode', () => {
    const stream = Stream.ofChars('name')
    const parsing = singleStringParser.parse(stream)

    expect(parsing.isAccepted()).toBe(true)
    const expected: SingleStringNode = {
      type: 'single-string',
      value: 'name',
    }
    expect(parsing.value).toEqual(expected)
  })

  // AC-SS-02: Identifier with hyphens is valid
  it('should parse identifier with hyphens', () => {
    const stream = Stream.ofChars('user-name')
    const parsing = singleStringParser.parse(stream)

    expect(parsing.isAccepted()).toBe(true)
    const expected: SingleStringNode = {
      type: 'single-string',
      value: 'user-name',
    }
    expect(parsing.value).toEqual(expected)
  })

  // AC-SS-03: Reserved words are rejected
  it('should reject reserved word "true"', () => {
    const stream = Stream.ofChars('true')
    const parsing = singleStringParser.parse(stream)

    expect(parsing.isAccepted()).toBe(false)
  })

  it('should reject reserved word "false"', () => {
    const stream = Stream.ofChars('false')
    const parsing = singleStringParser.parse(stream)

    expect(parsing.isAccepted()).toBe(false)
  })

  it('should reject reserved word "if"', () => {
    const stream = Stream.ofChars('if')
    const parsing = singleStringParser.parse(stream)

    expect(parsing.isAccepted()).toBe(false)
  })

  it('should reject reserved word "output"', () => {
    const stream = Stream.ofChars('output')
    const parsing = singleStringParser.parse(stream)

    expect(parsing.isAccepted()).toBe(false)
  })

  // AC-SS-04: Dots are not allowed (parser stops before the dot)
  it('should not parse dots as part of SingleString', () => {
    const stream = Stream.ofChars('settings.theme')
    const parsing = singleStringParser.parse(stream)

    // Parser accepts "settings" but stops before the dot
    // The parser will accept partial input and stop at the dot
    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({
      type: 'single-string',
      value: 'settings',
    })
    // Note: The parser correctly consumes only "settings", not "settings.theme"
    // The calling code (mapper parser) would handle the remaining ".theme" as invalid
  })

  // AC-SS-05: Trailing hyphen is rejected
  it('should reject identifier with trailing hyphen', () => {
    const stream = Stream.ofChars('user-')
    const parsing = singleStringParser.parse(stream)

    expect(parsing.isAccepted()).toBe(false)
  })

  // Additional edge cases
  it('should parse identifier starting with underscore', () => {
    const stream = Stream.ofChars('_private')
    const parsing = singleStringParser.parse(stream)

    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({
      type: 'single-string',
      value: '_private',
    })
  })

  it('should parse identifier with numbers', () => {
    const stream = Stream.ofChars('user123')
    const parsing = singleStringParser.parse(stream)

    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({
      type: 'single-string',
      value: 'user123',
    })
  })

  it('should parse single character identifier', () => {
    const stream = Stream.ofChars('x')
    const parsing = singleStringParser.parse(stream)

    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({
      type: 'single-string',
      value: 'x',
    })
  })

  it('should parse complex multi-hyphen identifier', () => {
    const stream = Stream.ofChars('my-long-property-name')
    const parsing = singleStringParser.parse(stream)

    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({
      type: 'single-string',
      value: 'my-long-property-name',
    })
  })

  it('should reject identifier starting with number', () => {
    const stream = Stream.ofChars('123name')
    const parsing = singleStringParser.parse(stream)

    expect(parsing.isAccepted()).toBe(false)
  })
})
