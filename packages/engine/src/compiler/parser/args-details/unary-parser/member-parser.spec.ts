import { describe, it, expect } from 'vitest'
import { F, GenLex, SingleParser, Stream } from '@masala/parser'

import { ExpressionNode, MemberExpressionNode } from '../../ast.js'
import { createArgumentTokens } from '../tokens/argument-tokens.js'
import { atomicParser } from '../tokens/literals-parser.js'
import { createMemberExpressionParser } from './member-parser.js'

export function buildMemberParserForTests(): SingleParser<MemberExpressionNode> {
  const genlex = new GenLex()
  const tokens = createArgumentTokens(genlex)
  const primary: SingleParser<ExpressionNode> = atomicParser(tokens)
  const grammar = createMemberExpressionParser(tokens, primary)
  return genlex.use(grammar)
}

describe('Member expression parser', () => {
  const grammar = buildMemberParserForTests()

  it('should accept a member expression', () => {
    const stream = Stream.ofChars('user.name')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    const expected: MemberExpressionNode = {
      type: 'member',
      object: { type: 'identifier', value: 'user' },
      path: ['name'],
      computed: false,
    }
    expect(parsing.value).toEqual(expected)
  })

  it('should accept a nested member expression', () => {
    const stream = Stream.ofChars('user.address.street')
    const parsing = grammar.parse(stream)
    expect(parsing.isAccepted()).toBe(true)
    const expected: MemberExpressionNode = {
      type: 'member',
      object: { type: 'identifier', value: 'user' },
      path: ['address', 'street'],
      computed: false,
    }
    expect(parsing.value).toEqual(expected)
  })
})
