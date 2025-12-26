import { describe, it, expect } from 'vitest'
import { F, Stream } from '@masala/parser'
import { buildInstructionParserForTest } from '../parser/instruction-parser.js'
import { normalizeIf } from './normalize-if.js'

describe('Normalize-if  instruction parser', () => {
  it('normalizes an instruction with reserved `if` into an IfNode', () => {
    const instruction = '@package/name arg1=10 if=testValue'
    const stream = Stream.ofChars(instruction)
    const grammar = buildInstructionParserForTest()
    const parsing = grammar.parse(stream)

    expect(parsing.isAccepted()).toBe(true)

    // Surface AST is an InstructionNode
    const instr = parsing.value

    // Normalize: turns the reserved `if` arg into an IfNode
    const normalized = normalizeIf(instr)

    // We should now have an IfNode
    expect((normalized as any).type).toBe('if')
    const ifNode = normalized as any

    // Test expression is the identifier `testValue`
    expect(ifNode.test).toEqual({ type: 'identifier', value: 'testValue' })

    // Consequent is the original instruction without the `if` argument
    expect(ifNode.consequent.type).toBe('instruction')
    expect(ifNode.consequent.args).toEqual([
      {
        type: 'argument',
        name: { type: 'identifier', value: 'arg1' },
        value: { type: 'literal-number', value: 10 },
      },
    ])

    // Ensure the `if` argument is gone
    expect(
      ifNode.consequent.args.find((a: any) => a.name.value === 'if'),
    ).toBeUndefined()
  })

  it('returns the instruction unchanged when no reserved `if` argument is present', () => {
    const instruction = '@package/name arg1=10'
    const stream = Stream.ofChars(instruction)
    const grammar = buildInstructionParserForTest()
    const parsing = grammar.parse(stream)

    expect(parsing.isAccepted()).toBe(true)

    const instr = parsing.value
    expect(instr.type).toBe('instruction')
    expect(instr.args.length).toBe(1)
    expect(instr.output).toBeUndefined()

    const normalized = normalizeIf(instr)

    // stays an InstructionNode (no IfNode wrapping)
    expect((normalized as any).type).toBe('instruction')

    // same reference (normalizeIf returns input when no `if` arg)
    expect(normalized).toBe(instr)

    // args unchanged
    expect((normalized as any).args).toEqual([
      {
        type: 'argument',
        name: { type: 'identifier', value: 'arg1' },
        value: { type: 'literal-number', value: 10 },
      },
    ])
  })
})
