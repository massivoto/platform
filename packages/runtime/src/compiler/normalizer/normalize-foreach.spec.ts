// normalizeForEach.spec.ts
import { describe, it, expect } from 'vitest'
import { Stream } from '@masala/parser'
import { buildInstructionParserForTest } from '../parser/instruction-parser.js'
import { normalizeForEach, parseForEachSpec } from './normalize-foreach.js'

describe('normalizeForEach', () => {
  it('parses "item of items"', () => {
    expect(parseForEachSpec('item of items')).toEqual({
      iterator: { type: 'identifier', value: 'item' },
      iterable: { type: 'identifier', value: 'items' },
    })
  })

  it('throws on bad syntax', () => {
    expect(() => parseForEachSpec('item in items')).toThrow()
  })

  // TODO: Re-enable when forEach reserved arg is implemented (requires MapperParser/IterationNode)
  it.skip('wraps an instruction with reserved forEach/of args into a ForEachNode', () => {
    const instruction = '@package/name arg1=10 forEach="item of items"'
    const stream = Stream.ofChars(instruction)
    const grammar = buildInstructionParserForTest()
    const parsing = grammar.parse(stream)

    expect(parsing.isAccepted()).toBe(true)

    const instr = parsing.value // InstructionNode
    const normalized = normalizeForEach(instr)

    // Becomes a ForEachNode
    expect((normalized as any).type).toBe('forEach')
    const fe = normalized as any

    // Iterator & iterable from the reserved args
    expect(fe.iterator).toEqual({ type: 'identifier', value: 'item' })
    expect(fe.iterable).toEqual({ type: 'identifier', value: 'items' })

    // Body is the original instruction without the reserved args
    expect(fe.body.type).toBe('instruction')
    expect(fe.body.args).toEqual([
      {
        type: 'argument',
        name: { type: 'identifier', value: 'arg1' },
        value: { type: 'literal-number', value: 10 },
      },
    ])

    // Ensure reserved args are gone
    expect(
      fe.body.args.find((a: any) => a.name.value === 'forEach'),
    ).toBeUndefined()
    expect(fe.body.args.find((a: any) => a.name.value === 'of')).toBeUndefined()
  })

  it('returns the instruction unchanged when no forEach/of args are present', () => {
    const instruction = '@package/name arg1=10'
    const stream = Stream.ofChars(instruction)
    const grammar = buildInstructionParserForTest()
    const parsing = grammar.parse(stream)

    expect(parsing.isAccepted()).toBe(true)

    const instr = parsing.value
    const normalized = normalizeForEach(instr)

    expect((normalized as any).type).toBe('instruction')
    expect(normalized).toBe(instr) // unchanged reference
    expect((normalized as any).args).toEqual([
      {
        type: 'argument',
        name: { type: 'identifier', value: 'arg1' },
        value: { type: 'literal-number', value: 10 },
      },
    ])
  })
})
