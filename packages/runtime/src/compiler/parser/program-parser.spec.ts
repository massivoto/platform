import { Stream } from '@masala/parser'
import { describe, expect, it } from 'vitest'
import { buildProgramParser } from './program-parser.js'
import { ProgramNode, InstructionNode } from './ast.js'

describe('Program parser', () => {
  const parser = buildProgramParser()

  describe('single instruction', () => {
    it('parses a single instruction as a program', () => {
      const source = '@api/call endpoint="/users"'
      const result = parser.val(source)

      expect(result.type).toBe('program')
      expect(result.body).toHaveLength(1)
      expect(result.body[0].type).toBe('instruction')
      expect((result.body[0] as InstructionNode).action.package).toBe('api')
      expect((result.body[0] as InstructionNode).action.name).toBe('call')
    })

    it('parses instruction with output', () => {
      const source = '@api/call endpoint="/users" output=users'
      const result = parser.val(source)

      expect(result.body).toHaveLength(1)
      const instruction = result.body[0] as InstructionNode
      expect(instruction.output?.value).toBe('users')
    })
  })

  describe('multiple instructions', () => {
    it('parses two instructions separated by newline', () => {
      const source = `@api/call endpoint="/users" output=users
@log/print msg=users`
      const result = parser.val(source)

      expect(result.type).toBe('program')
      expect(result.body).toHaveLength(2)
      expect((result.body[0] as InstructionNode).action.name).toBe('call')
      expect((result.body[1] as InstructionNode).action.name).toBe('print')
    })

    it('parses three instructions', () => {
      const source = `@setup/init
@process/data input=raw output=processed
@cleanup/done`
      const result = parser.val(source)

      expect(result.body).toHaveLength(3)
      expect((result.body[0] as InstructionNode).action.name).toBe('init')
      expect((result.body[1] as InstructionNode).action.name).toBe('data')
      expect((result.body[2] as InstructionNode).action.name).toBe('done')
    })

    it('handles Windows-style CRLF line endings', () => {
      const source = '@first/action\r\n@second/action'
      const result = parser.val(source)

      expect(result.body).toHaveLength(2)
    })
  })

  describe('blank lines and whitespace', () => {
    it('allows multiple blank lines between instructions', () => {
      const source = `@first/action


@second/action`
      const result = parser.val(source)

      expect(result.body).toHaveLength(2)
    })

    it('ignores leading blank lines', () => {
      const source = `

@first/action`
      const result = parser.val(source)

      expect(result.body).toHaveLength(1)
      expect((result.body[0] as InstructionNode).action.name).toBe('action')
    })

    it('ignores trailing blank lines', () => {
      const source = `@first/action

`
      const result = parser.val(source)

      expect(result.body).toHaveLength(1)
    })

    it('handles indented instructions (indentation is cosmetic)', () => {
      const source = `@first/action
  @second/action
    @third/action`
      const result = parser.val(source)

      expect(result.body).toHaveLength(3)
    })
  })

  describe('empty program', () => {
    it('parses empty string as empty program', () => {
      const source = ''
      const result = parser.val(source)

      expect(result.type).toBe('program')
      expect(result.body).toHaveLength(0)
    })

    it('parses whitespace-only as empty program', () => {
      const source = '   \n\n  \n  '
      const result = parser.val(source)

      expect(result.type).toBe('program')
      expect(result.body).toHaveLength(0)
    })
  })

  describe('complex instructions', () => {
    it('parses instructions with pipe expressions', () => {
      const source = `@api/fetch url="https://api.example.com" output=data
@transform/filter items={data|filter:active}`
      const result = parser.val(source)

      expect(result.body).toHaveLength(2)
    })

    it('parses instructions with if conditions', () => {
      const source = `@setup/check output=ready
@process/run if=ready`
      const result = parser.val(source)

      expect(result.body).toHaveLength(2)
      const secondInstruction = result.body[1] as InstructionNode
      expect(secondInstruction.condition).toBeDefined()
    })

    it('parses instructions with array arguments', () => {
      const source = `@batch/process ids=[1, 2, 3]
@notify/send users=["alice", "bob"]`
      const result = parser.val(source)

      expect(result.body).toHaveLength(2)
    })
  })
})
