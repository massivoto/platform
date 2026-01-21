import { describe, it, expect } from 'vitest'
import { Stream } from '@masala/parser'
import { buildInstructionParserForTest } from './instruction-parser.js'
import { ForEachArgNode, InstructionNode } from './ast.js'

describe('ForEach Reserved Argument', () => {
  const grammarForAccept = buildInstructionParserForTest()
  const grammarForReject = buildInstructionParserForTest().thenEos()

  function parse(instruction: string) {
    const stream = Stream.ofChars(instruction)
    return grammarForAccept.parse(stream)
  }

  function parseStrict(instruction: string) {
    const stream = Stream.ofChars(instruction)
    return grammarForReject.parse(stream)
  }

  describe('R-FE-61: forEachArg parser', () => {
    it('parses forEach=users -> user (simple identifier iterable)', () => {
      const parsing = parse('@block/begin forEach=users -> user')
      expect(parsing.isAccepted()).toBe(true)
      const instr = parsing.value as InstructionNode

      expect(instr.forEach).toBeDefined()
      const forEach = instr.forEach as ForEachArgNode
      expect(forEach.type).toBe('forEach-arg')
      expect(forEach.iterable).toEqual({ type: 'identifier', value: 'users' })
      expect(forEach.iterator).toEqual({ type: 'single-string', value: 'user' })
    })

    it('parses forEach=data.users -> user (member expression iterable)', () => {
      const parsing = parse('@block/begin forEach=data.users -> user')
      expect(parsing.isAccepted()).toBe(true)
      const instr = parsing.value as InstructionNode

      expect(instr.forEach).toBeDefined()
      const forEach = instr.forEach as ForEachArgNode
      expect(forEach.iterable.type).toBe('member')
    })

    it('parses forEach={users|filter:active} -> user (pipe expression iterable)', () => {
      const parsing = parse('@block/begin forEach={users|filter:active} -> user')
      expect(parsing.isAccepted()).toBe(true)
      const instr = parsing.value as InstructionNode

      expect(instr.forEach).toBeDefined()
      const forEach = instr.forEach as ForEachArgNode
      expect(forEach.iterable.type).toBe('pipe-expression')
    })

    it('parses forEach=[1, 2, 3] -> num (array literal iterable)', () => {
      const parsing = parse('@block/begin forEach=[1, 2, 3] -> num')
      expect(parsing.isAccepted()).toBe(true)
      const instr = parsing.value as InstructionNode

      expect(instr.forEach).toBeDefined()
      const forEach = instr.forEach as ForEachArgNode
      expect(forEach.iterable.type).toBe('array-literal')
    })

    it('rejects forEach=users (missing arrow and iterator)', () => {
      const parsing = parseStrict('@block/begin forEach=users')
      // Should fail because forEach requires mapper syntax
      expect(parsing.isAccepted()).toBe(false)
    })

    it('rejects forEach="not a mapper" (string literal)', () => {
      const parsing = parseStrict('@block/begin forEach="users -> user"')
      // String literal is not a mapper expression
      expect(parsing.isAccepted()).toBe(false)
    })
  })

  describe('R-FE-02: System variable identifiers (_ prefix)', () => {
    it('parses identifier with _ prefix (_index)', () => {
      const parsing = parse('@utils/log message=_index')
      expect(parsing.isAccepted()).toBe(true)
      const instr = parsing.value as InstructionNode

      const arg = instr.args[0]
      expect(arg.value).toEqual({ type: 'identifier', value: '_index' })
    })

    it('parses identifier with _ prefix (_first)', () => {
      const parsing = parse('@utils/log message=_first')
      expect(parsing.isAccepted()).toBe(true)
    })

    it('parses iterator with _ prefix (unusual but allowed)', () => {
      const parsing = parse('@block/begin forEach=items -> _item')
      expect(parsing.isAccepted()).toBe(true)
      const instr = parsing.value as InstructionNode

      expect(instr.forEach).toBeDefined()
      expect((instr.forEach as ForEachArgNode).iterator.value).toBe('_item')
    })
  })

  describe('AC-FE-01 to AC-FE-04: Parsing acceptance criteria', () => {
    it('AC-FE-01: forEach=users -> user produces correct AST structure', () => {
      const parsing = parse('@block/begin forEach=users -> user')
      expect(parsing.isAccepted()).toBe(true)
      const instr = parsing.value as InstructionNode

      expect(instr.forEach).toEqual({
        type: 'forEach-arg',
        iterable: { type: 'identifier', value: 'users' },
        iterator: { type: 'single-string', value: 'user' },
      })
    })

    it('AC-FE-02: forEach with pipe expression produces PipeExpressionNode iterable', () => {
      const parsing = parse(
        '@block/begin forEach={users|filter:active} -> user',
      )
      expect(parsing.isAccepted()).toBe(true)
      const instr = parsing.value as InstructionNode

      expect(instr.forEach?.iterable.type).toBe('pipe-expression')
    })

    it('AC-FE-03: forEach without arrow rejects', () => {
      const parsing = parseStrict('@block/begin forEach=users')
      expect(parsing.isAccepted()).toBe(false)
    })
  })

  describe('combined with other reserved args', () => {
    it('parses forEach with name argument', () => {
      const parsing = parse('@block/begin name="loop" forEach=items -> item')
      expect(parsing.isAccepted()).toBe(true)
      const instr = parsing.value as InstructionNode

      expect(instr.forEach).toBeDefined()
      // name should be in regular args
      const nameArg = instr.args.find((a) => a.name.value === 'name')
      expect(nameArg).toBeDefined()
    })

    it('parses forEach with output (unusual but not prevented at parse level)', () => {
      const parsing = parse('@block/begin forEach=items -> item output=result')
      expect(parsing.isAccepted()).toBe(true)
      const instr = parsing.value as InstructionNode

      expect(instr.forEach).toBeDefined()
      expect(instr.output).toBeDefined()
    })
  })
})
