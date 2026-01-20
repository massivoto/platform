import { describe, it, expect } from 'vitest'
import { Stream } from '@masala/parser'
import { buildInstructionParserForTest } from './instruction-parser.js'

describe('Reserved Arguments', () => {
  // Two grammars: one for acceptance tests, one for rejection tests
  const grammarForAccept = buildInstructionParserForTest()
  // thenEos() ensures full consumption - use for rejection tests
  const grammarForReject = buildInstructionParserForTest().thenEos()

  function parse(instruction: string) {
    const stream = Stream.ofChars(instruction)
    return grammarForAccept.parse(stream)
  }

  function parseStrict(instruction: string) {
    const stream = Stream.ofChars(instruction)
    return grammarForReject.parse(stream)
  }

  describe('output=identifier', () => {
    it('parses output=result and stores in InstructionNode.output', () => {
      const parsing = parse('@twitter/post message="hello" output=result')
      expect(parsing.isAccepted()).toBe(true)
      const instr = parsing.value

      expect(instr.output).toBeDefined()
      expect(instr.output).toEqual({ type: 'identifier', value: 'result' })
      // Regular args should not contain output
      expect(
        instr.args.find((a: any) => a.name.value === 'output'),
      ).toBeUndefined()
    })

    it('parses output at beginning of args', () => {
      const parsing = parse('@twitter/post output=tweets message="hello"')

      expect(parsing.isAccepted()).toBe(true)
      const instr = parsing.value

      expect(instr.output).toEqual({ type: 'identifier', value: 'tweets' })
      expect(instr.args.length).toBe(1)
      expect(instr.args[0].name.value).toBe('message')
    })

    it('parses output as only arg', () => {
      const parsing = parse('@data/fetch output=response')

      expect(parsing.isAccepted()).toBe(true)
      const instr = parsing.value

      expect(instr.output).toEqual({ type: 'identifier', value: 'response' })
      expect(instr.args.length).toBe(0)
    })

    it('rejects output=123 (must be identifier)', () => {
      const parsing = parseStrict('@twitter/post output=123')
      expect(parsing.isAccepted()).toBe(false)
    })

    it('rejects output="string" (must be identifier)', () => {
      const parsing = parseStrict('@twitter/post output="result"')
      expect(parsing.isAccepted()).toBe(false)
    })
  })

  describe('if=expression', () => {
    it('parses if=identifier and stores in InstructionNode.condition', () => {
      const parsing = parse('@twitter/post message="hello" if=isVerified')

      expect(parsing.isAccepted()).toBe(true)
      const instr = parsing.value

      expect(instr.condition).toBeDefined()
      expect(instr.condition).toEqual({
        type: 'identifier',
        value: 'isVerified',
      })
    })

    it('parses if={binary expression}', () => {
      const parsing = parse(
        '@twitter/post message="hello" if={followers > 100}',
      )

      expect(parsing.isAccepted()).toBe(true)
      const instr = parsing.value

      expect(instr.condition).toBeDefined()
      expect(instr.condition?.type).toBe('binary')
      expect((instr.condition as any).operator).toBe('>')
    })

    it('parses if={logical expression}', () => {
      const parsing = parse('@twitter/post if={isActive && hasPermission}')

      expect(parsing.isAccepted()).toBe(true)
      const instr = parsing.value

      expect(instr.condition?.type).toBe('logical')
      expect((instr.condition as any).operator).toBe('&&')
    })

    it('parses if={comparison with number}', () => {
      const parsing = parse('@data/filter if={count >= 10}')

      expect(parsing.isAccepted()).toBe(true)
      const instr = parsing.value

      expect(instr.condition?.type).toBe('binary')
      expect((instr.condition as any).operator).toBe('>=')
      expect((instr.condition as any).left).toEqual({
        type: 'identifier',
        value: 'count',
      })
      expect((instr.condition as any).right).toEqual({
        type: 'literal-number',
        value: 10,
      })
    })

    it('parses if with boolean literal', () => {
      const parsing = parse('@debug/log if=true')

      expect(parsing.isAccepted()).toBe(true)
      const instr = parsing.value

      expect(instr.condition).toEqual({ type: 'literal-boolean', value: true })
    })
  })

  describe('strict syntax (no spaces around =)', () => {
    it('rejects if = condition (space before =)', () => {
      const parsing = parseStrict('@twitter/post if = isActive')
      // 'if' alone is a reserved word, can't be used as identifier
      // So this should fail to parse
      expect(parsing.isAccepted()).toBe(false)
    })

    it('rejects output = result (space before =)', () => {
      const parsing = parseStrict('@twitter/post output = result')
      // 'output' is now a reserved word, can't be used as identifier
      expect(parsing.isAccepted()).toBe(false)
    })

    it('accepts if= condition (space after = is just token separator)', () => {
      // 'if=' is a single token, space after is just GenLex separator
      // This is different from 'if = cond' where space breaks the token
      const parsing = parse('@twitter/post if= isActive')
      expect(parsing.isAccepted()).toBe(true)
      expect(parsing.value.condition).toEqual({
        type: 'identifier',
        value: 'isActive',
      })
    })
  })

  describe('combined reserved args', () => {
    it('parses both output and if on same instruction', () => {
      const parsing = parse(
        '@twitter/post message="hello" if=isActive output=result',
      )

      expect(parsing.isAccepted()).toBe(true)
      const instr = parsing.value

      expect(instr.condition).toEqual({ type: 'identifier', value: 'isActive' })
      expect(instr.output).toEqual({ type: 'identifier', value: 'result' })
      expect(instr.args.length).toBe(1)
      expect(instr.args[0].name.value).toBe('message')
    })

    it('parses reserved args in any order', () => {
      const parsing = parse(
        '@twitter/post output=result if=isActive message="hello"',
      )

      expect(parsing.isAccepted()).toBe(true)
      const instr = parsing.value

      expect(instr.output).toBeDefined()
      expect(instr.condition).toBeDefined()
      expect(instr.args.length).toBe(1)
    })
  })

  describe('no reserved args', () => {
    it('parses instruction without reserved args', () => {
      const parsing = parse('@twitter/post message="hello" count=5')

      expect(parsing.isAccepted()).toBe(true)
      const instr = parsing.value

      expect(instr.output).toBeUndefined()
      expect(instr.condition).toBeUndefined()
      expect(instr.args.length).toBe(2)
    })

    it('parses instruction with no args at all', () => {
      const parsing = parse('@system/ping')

      expect(parsing.isAccepted()).toBe(true)
      const instr = parsing.value

      expect(instr.output).toBeUndefined()
      expect(instr.condition).toBeUndefined()
      expect(instr.args.length).toBe(0)
    })
  })
})
