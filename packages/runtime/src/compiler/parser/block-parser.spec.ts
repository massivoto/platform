import { describe, expect, it } from 'vitest'
import { buildProgramParser } from './program-parser.js'
import { BlockNode, InstructionNode } from './ast.js'

describe('Block parser', () => {
  const parser = buildProgramParser()

  describe('basic blocks', () => {
    it('parses empty block', () => {
      const source = `@block/begin
@block/end`
      const result = parser.val(source)

      expect(result.body).toHaveLength(1)
      const block = result.body[0] as BlockNode
      expect(block.type).toBe('block')
      expect(block.body).toHaveLength(0)
    })

    it('parses block with single instruction', () => {
      const source = `@block/begin
@api/call endpoint="/users" output=users
@block/end`
      const result = parser.val(source)

      expect(result.body).toHaveLength(1)
      const block = result.body[0] as BlockNode
      expect(block.type).toBe('block')
      expect(block.body).toHaveLength(1)
      expect((block.body[0] as InstructionNode).action.name).toBe('call')
    })

    it('parses block with multiple instructions', () => {
      const source = `@block/begin
@setup/init
@process/data input=raw output=processed
@cleanup/done
@block/end`
      const result = parser.val(source)

      expect(result.body).toHaveLength(1)
      const block = result.body[0] as BlockNode
      expect(block.body).toHaveLength(3)
    })
  })

  describe('block with name', () => {
    it('parses block with name argument', () => {
      const source = `@block/begin name="setup"
@api/call endpoint="/config"
@block/end`
      const result = parser.val(source)

      const block = result.body[0] as BlockNode
      expect(block.name).toBe('setup')
    })

    it('parses block with name containing spaces', () => {
      const source = `@block/begin name="my setup phase"
@api/call endpoint="/config"
@block/end`
      const result = parser.val(source)

      const block = result.body[0] as BlockNode
      expect(block.name).toBe('my setup phase')
    })
  })

  describe('block with condition', () => {
    it('parses block with if condition (identifier)', () => {
      const source = `@block/begin if=isAdmin
@admin/dashboard
@block/end`
      const result = parser.val(source)

      const block = result.body[0] as BlockNode
      expect(block.condition).toBeDefined()
      expect(block.condition?.type).toBe('identifier')
    })

    it('parses block with if condition (expression)', () => {
      const source = `@block/begin if={userRole == "admin"}
@admin/dashboard
@block/end`
      const result = parser.val(source)

      const block = result.body[0] as BlockNode
      expect(block.condition).toBeDefined()
      expect(block.condition?.type).toBe('binary')
    })

    it('parses block with both name and if', () => {
      const source = `@block/begin name="admin-section" if=isAdmin
@admin/dashboard
@admin/stats output=stats
@block/end`
      const result = parser.val(source)

      const block = result.body[0] as BlockNode
      expect(block.name).toBe('admin-section')
      expect(block.condition).toBeDefined()
    })
  })

  describe('nested blocks', () => {
    it('parses nested blocks', () => {
      const source = `@block/begin name="outer"
@setup/init
@block/begin name="inner"
@process/data
@block/end
@cleanup/done
@block/end`
      const result = parser.val(source)

      expect(result.body).toHaveLength(1)
      const outer = result.body[0] as BlockNode
      expect(outer.name).toBe('outer')
      expect(outer.body).toHaveLength(3)

      const inner = outer.body[1] as BlockNode
      expect(inner.type).toBe('block')
      expect(inner.name).toBe('inner')
      expect(inner.body).toHaveLength(1)
    })

    it('parses deeply nested blocks', () => {
      const source = `@block/begin name="level1"
@block/begin name="level2"
@block/begin name="level3"
@deep/action
@block/end
@block/end
@block/end`
      const result = parser.val(source)

      const level1 = result.body[0] as BlockNode
      expect(level1.name).toBe('level1')

      const level2 = level1.body[0] as BlockNode
      expect(level2.name).toBe('level2')

      const level3 = level2.body[0] as BlockNode
      expect(level3.name).toBe('level3')
      expect((level3.body[0] as InstructionNode).action.name).toBe('action')
    })
  })

  describe('blocks with surrounding instructions', () => {
    it('parses instructions before and after block', () => {
      const source = `@setup/init
@block/begin name="process"
@process/data
@block/end
@cleanup/done`
      const result = parser.val(source)

      expect(result.body).toHaveLength(3)
      expect((result.body[0] as InstructionNode).action.name).toBe('init')
      expect((result.body[1] as BlockNode).type).toBe('block')
      expect((result.body[2] as InstructionNode).action.name).toBe('done')
    })

    it('parses multiple blocks in sequence', () => {
      const source = `@block/begin name="first"
@first/action
@block/end
@block/begin name="second"
@second/action
@block/end`
      const result = parser.val(source)

      expect(result.body).toHaveLength(2)
      expect((result.body[0] as BlockNode).name).toBe('first')
      expect((result.body[1] as BlockNode).name).toBe('second')
    })
  })

  describe('error handling', () => {
    it('throws error for unclosed block', () => {
      const source = `@block/begin name="unclosed"
@some/action`

      expect(() => parser.val(source)).toThrow(/[Uu]nclosed block/)
    })

    it('throws error for unexpected @block/end', () => {
      const source = `@some/action
@block/end`

      expect(() => parser.val(source)).toThrow(/@block\/end/)
    })

    it('throws error for mismatched nesting', () => {
      const source = `@block/begin name="outer"
@block/begin name="inner"
@block/end
@block/end
@block/end`

      expect(() => parser.val(source)).toThrow()
    })
  })
})
