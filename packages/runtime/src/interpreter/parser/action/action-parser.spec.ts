import { Stream } from '@masala/parser'
import { describe, expect, it } from 'vitest'
import { buildActionParser } from './action-parser.js'

// Uses buildActionParser() which has its own GenLex with no separators
const grammar = buildActionParser()

describe('Action parser (no-separator GenLex)', () => {
  it('should accept a simple action', () => {
    const stream = Stream.ofChars('@package/name')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({
      type: 'action',
      package: 'package',
      name: 'name',
      path: ['package', 'name'],
    })
  })

  it('should accept a sub action', () => {
    const stream = Stream.ofChars('@package/path/name')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({
      type: 'action',
      package: 'package',
      name: 'name',
      path: ['package', 'path', 'name'],
    })
  })

  it('should decline action without @ prefix', () => {
    const stream = Stream.ofChars('package/name')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(false)
  })

  it('should decline action without segment (@package alone)', () => {
    const stream = Stream.ofChars('@package')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(false)
  })

  describe('rejects actions with internal spaces', () => {
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
