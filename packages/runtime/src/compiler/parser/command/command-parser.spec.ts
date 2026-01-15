import { Stream } from '@masala/parser'
import { describe, expect, it } from 'vitest'
import { buildCommandParser } from './command-parser.js'

// Uses buildCommandParser() which has its own GenLex with no separators
const grammar = buildCommandParser()

describe('Command parser (no-separator GenLex)', () => {
  it('should accept a simple command', () => {
    const stream = Stream.ofChars('@package/name')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({
      type: 'command',
      package: 'package',
      name: 'name',
      path: ['package', 'name'],
    })
  })

  it('should accept a sub command', () => {
    const stream = Stream.ofChars('@package/path/name')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({
      type: 'command',
      package: 'package',
      name: 'name',
      path: ['package', 'path', 'name'],
    })
  })

  it('should decline command without @ prefix', () => {
    const stream = Stream.ofChars('package/name')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(false)
  })

  it('should decline command without segment (@package alone)', () => {
    const stream = Stream.ofChars('@package')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(false)
  })

  describe('rejects commands with internal spaces', () => {
    it('should reject @package name (space instead of /)', () => {
      const stream = Stream.ofChars('@package name')
      const parsing = grammar.parse(stream)
      expect(parsing.isAccepted()).toBe(false)
    })

    it('should reject @package/ name (space after /)', () => {
      const stream = Stream.ofChars('@package/ name')
      const parsing = grammar.parse(stream)
      expect(parsing.isAccepted()).toBe(false)
    })

    it('should reject @ package/name (space after @)', () => {
      const stream = Stream.ofChars('@ package/name')
      const parsing = grammar.parse(stream)
      expect(parsing.isAccepted()).toBe(false)
    })

    it('should reject @pkg /name (space before /)', () => {
      const stream = Stream.ofChars('@pkg /name')
      const parsing = grammar.parse(stream)
      expect(parsing.isAccepted()).toBe(false)
    })
  })
})
