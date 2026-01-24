import { describe, it, expect } from 'vitest'
import { buildProgramParser } from './program-parser.js'
import { BlockNode, InstructionNode, ForEachArgNode } from './ast.js'

describe('ForEach Block Integration', () => {
  const parser = buildProgramParser()

  describe('R-FE-81: Block parser extracts forEach from @block/begin', () => {
    it('parses block with forEach=users -> user', () => {
      const source = `@block/begin forEach=users -> user
@utils/log message=user.name
@block/end`
      const result = parser.val(source)

      expect(result.body).toHaveLength(1)
      const block = result.body[0] as BlockNode
      expect(block.type).toBe('block')
      expect(block.forEach).toBeDefined()

      const forEach = block.forEach as ForEachArgNode
      expect(forEach.type).toBe('forEach-arg')
      expect(forEach.iterable).toEqual({ type: 'identifier', value: 'users' })
      expect(forEach.iterator).toEqual({ type: 'single-string', value: 'user' })
    })

    it('parses block with forEach and name', () => {
      const source = `@block/begin name="user-loop" forEach=users -> user
@utils/log message=user.name
@block/end`
      const result = parser.val(source)

      const block = result.body[0] as BlockNode
      expect(block.name).toBe('user-loop')
      expect(block.forEach).toBeDefined()
    })

    it('parses block with forEach using member expression', () => {
      const source = `@block/begin forEach=data.users -> user
@utils/log message=user
@block/end`
      const result = parser.val(source)

      const block = result.body[0] as BlockNode
      expect(block.forEach).toBeDefined()
      expect(block.forEach?.iterable.type).toBe('member')
    })

    it('parses block with forEach using pipe expression', () => {
      const source = `@block/begin forEach={users|filter:active} -> user
@utils/log message=user
@block/end`
      const result = parser.val(source)

      const block = result.body[0] as BlockNode
      expect(block.forEach).toBeDefined()
      expect(block.forEach?.iterable.type).toBe('pipe-expression')
    })

    it('parses block with forEach using array literal', () => {
      const source = `@block/begin forEach=[1, 2, 3] -> num
@utils/log message=num
@block/end`
      const result = parser.val(source)

      const block = result.body[0] as BlockNode
      expect(block.forEach).toBeDefined()
      expect(block.forEach?.iterable.type).toBe('array-literal')
    })
  })

  describe('R-FE-82: forEach and if are mutually exclusive', () => {
    it('rejects block with both forEach and if', () => {
      const source = `@block/begin forEach=users -> user if=isActive
@utils/log message=user
@block/end`

      expect(() => parser.val(source)).toThrow(
        /Block cannot have both forEach= and if=/,
      )
    })

    it('rejects block with if before forEach', () => {
      const source = `@block/begin if=isActive forEach=users -> user
@utils/log message=user
@block/end`

      expect(() => parser.val(source)).toThrow(
        /Block cannot have both forEach= and if=/,
      )
    })
  })

  describe('nested forEach blocks', () => {
    it('parses nested forEach blocks', () => {
      const source = `@block/begin forEach=users -> user
@utils/log message=user.name
@block/begin forEach=user.tweets -> tweet
@utils/log message=tweet.text
@block/end
@block/end`
      const result = parser.val(source)

      const outer = result.body[0] as BlockNode
      expect(outer.forEach).toBeDefined()
      expect(outer.forEach?.iterator.value).toBe('user')

      // Inner block is the second statement in outer block body
      const inner = outer.body[1] as BlockNode
      expect(inner.forEach).toBeDefined()
      expect(inner.forEach?.iterator.value).toBe('tweet')
    })

    it('parses forEach inside conditional block', () => {
      const source = `@block/begin if=isActive
@block/begin forEach=users -> user
@utils/log message=user
@block/end
@block/end`
      const result = parser.val(source)

      const outer = result.body[0] as BlockNode
      expect(outer.condition).toBeDefined()
      expect(outer.forEach).toBeUndefined()

      const inner = outer.body[0] as BlockNode
      expect(inner.forEach).toBeDefined()
      expect(inner.condition).toBeUndefined()
    })

    it('parses conditional block inside forEach', () => {
      const source = `@block/begin forEach=users -> user
@block/begin if=user.active
@utils/log message=user.name
@block/end
@block/end`
      const result = parser.val(source)

      const outer = result.body[0] as BlockNode
      expect(outer.forEach).toBeDefined()

      const inner = outer.body[0] as BlockNode
      expect(inner.condition).toBeDefined()
    })
  })

  describe('forEach with system variables in body', () => {
    it('parses body using _index system variable', () => {
      const source = `@block/begin forEach=users -> user
@utils/log message=_index
@block/end`
      const result = parser.val(source)

      const block = result.body[0] as BlockNode
      const instruction = block.body[0] as InstructionNode
      expect(instruction.args[0].value).toEqual({
        type: 'identifier',
        value: '_index',
      })
    })

    it('parses body using _first, _last, _odd, _even', () => {
      // Note: Ternary expressions are not yet supported, using simple identifiers
      const source = `@block/begin forEach=items -> item
@utils/log message=_first
@utils/log message=_last
@utils/log message=_odd
@utils/log message=_even
@block/end`
      const result = parser.val(source)

      const block = result.body[0] as BlockNode
      expect(block.body).toHaveLength(4)
      // Verify the system variables are parsed as identifiers
      const instruction = block.body[0] as InstructionNode
      expect(instruction.args[0].value).toEqual({
        type: 'identifier',
        value: '_first',
      })
    })
  })
})
