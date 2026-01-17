import { Stream } from '@masala/parser'
import { describe, expect, it } from 'vitest'
import { buildInstructionParserForTest } from './instruction-parser.js'

describe('Genlex for instruction parser', () => {
  it('should accept a full instruction', () => {
    let instruction = '@package/name arg1=10 output=out1'
    let stream = Stream.ofChars(instruction)
    let grammar = buildInstructionParserForTest()
    let parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value).toEqual({
      type: 'instruction',
      action: {
        type: 'action',
        package: 'package',
        name: 'name',
        path: ['package', 'name'],
      },
      args: [
        {
          type: 'argument',
          name: { type: 'identifier', value: 'arg1' },
          value: { type: 'literal-number', value: 10 },
        },
      ],
      output: {
        type: 'identifier',
        value: 'out1',
      },
    })
  })

  it('checks that output is valid', () => {
    let instruction = '@package/name arg1 = 10 output = 10'
    let stream = Stream.ofChars(instruction)
    let grammar = buildInstructionParserForTest()
    let parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    expect(parsing.value.args.length).toEqual(1)
    expect(parsing.value.output).toBeUndefined()
  })
  it('should decline bad instructions', () => {
    let instruction = 'package/name arg1 = 10 output = out1'
    let stream = Stream.ofChars(instruction)
    const grammar = buildInstructionParserForTest().thenEos()
    let parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(false)

    instruction = '@package name arg1 = 10 output = out1'
    stream = Stream.ofChars(instruction)
    parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(false)

    instruction = '@package/name arg1 = 10 output ='
    stream = Stream.ofChars(instruction)
    parsing = grammar.parse(stream)
    console.log(grammar.val(instruction))
    expect(parsing.isAccepted()).toBe(false)

    instruction = '@package/name arg1 = 10 output = out1 extra'
    stream = Stream.ofChars(instruction)
    parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(false)
  })
})
