import { GenLex, SingleParser, Stream } from '@masala/parser'
import { describe, expect, it } from 'vitest'
import { CommandNode } from '../ast.js'
import { createCommandGrammar } from './command-parser.js'
import { createCommandTokens } from './command-tokens.js'

function buildCommandParserForTest(): SingleParser<CommandNode> {
  const genlex = new GenLex()
  const tokens = createCommandTokens(genlex)
  const grammar = createCommandGrammar(tokens)
  return genlex.use(grammar)
}

describe('Genlex for command parser', () => {
  const grammar = buildCommandParserForTest()
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

  it('should decline bad commands', () => {
    let stream = Stream.ofChars('@package name')
    let parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(false)

    /* TODO: Re-enable this test when fixing the command token as a separated Genlex
    stream = Stream.ofChars('@package/ name')
    parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(false)

     */

    stream = Stream.ofChars('package/name')
    parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(false)
  })
})
