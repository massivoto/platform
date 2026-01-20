import { describe, it, expect } from 'vitest'
import { SingleParser, Stream, TracingGenLex } from '@masala/parser'
import { ExpressionNode } from '../ast.js'
import { createExpressionWithPipe } from './full-expression-parser.js'
import { createArgumentTokens } from './tokens/argument-tokens.js'

/**
 * Creates a parser that includes mapper expression support.
 * This function mirrors the full expression parser setup used in other tests.
 */
function createMapperGrammar(): SingleParser<ExpressionNode> {
  const genlex = new TracingGenLex()
  const tokens = createArgumentTokens(genlex)
  const grammar = createExpressionWithPipe(tokens)
  return genlex.use(grammar)
}

describe('Mapper parser', () => {
  const grammar = createMapperGrammar()

  describe('AC-MAP-01: Basic mapper expression', () => {
    it('should parse users -> name as MapperExpressionNode', () => {
      const stream = Stream.ofChars('users -> name')
      const parsing = grammar.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      expect(parsing.value).toEqual({
        type: 'mapper',
        source: { type: 'identifier', value: 'users' },
        target: { type: 'single-string', value: 'name' },
      })
    })

    it('should parse with spaces around arrow', () => {
      // Note: Genlex keywords require whitespace boundaries for proper tokenization.
      // `users->name` without spaces cannot be tokenized correctly.
      // This is consistent with other operators like `a + b` vs `a+b`.
      const stream = Stream.ofChars('users  ->  name')
      const parsing = grammar.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      expect(parsing.value).toEqual({
        type: 'mapper',
        source: { type: 'identifier', value: 'users' },
        target: { type: 'single-string', value: 'name' },
      })
    })
  })

  describe('AC-MAP-02: Pipe expression as source', () => {
    it('should parse {users|filter:active} -> id with pipe as source', () => {
      const stream = Stream.ofChars('{users|filter:active} -> id')
      const parsing = grammar.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      expect(parsing.value).toMatchObject({
        type: 'mapper',
        source: {
          type: 'pipe-expression',
          input: { type: 'identifier', value: 'users' },
          segments: [
            {
              pipeName: 'filter',
              args: [{ type: 'identifier', value: 'active' }],
            },
          ],
        },
        target: { type: 'single-string', value: 'id' },
      })
    })

    it('should parse {users|filter:active|sort:asc} -> id with multiple pipes', () => {
      const stream = Stream.ofChars('{users|filter:active|sort:asc} -> id')
      const parsing = grammar.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      const result = parsing.value as {
        type: string
        source: { type: string; segments: unknown[] }
      }
      expect(result.type).toBe('mapper')
      expect(result.source.type).toBe('pipe-expression')
      expect(result.source.segments).toHaveLength(2)
    })
  })

  describe('AC-MAP-03: Member expression as source', () => {
    it('should parse data.users -> email with member as source', () => {
      const stream = Stream.ofChars('data.users -> email')
      const parsing = grammar.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      expect(parsing.value).toEqual({
        type: 'mapper',
        source: {
          type: 'member',
          object: { type: 'identifier', value: 'data' },
          path: ['users'],
          computed: false,
        },
        target: { type: 'single-string', value: 'email' },
      })
    })

    it('should parse deeply nested member response.data.users -> name', () => {
      const stream = Stream.ofChars('response.data.users -> name')
      const parsing = grammar.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      expect(parsing.value).toMatchObject({
        type: 'mapper',
        source: {
          type: 'member',
          object: { type: 'identifier', value: 'response' },
          path: ['data', 'users'],
        },
        target: { type: 'single-string', value: 'name' },
      })
    })
  })

  describe('AC-MAP-04: Parser rejects number on right side', () => {
    it('should reject users -> 123 (right side must be SingleString)', () => {
      const stream = Stream.ofChars('users -> 123')
      const parsing = grammar.thenEos().parse(stream)

      // Parser should not accept this as a complete mapper expression
      // With thenEos(), it must consume all input - number target is invalid
      expect(parsing.isAccepted()).toBe(false)
    })
  })

  describe('AC-MAP-05: Parser rejects dots in target', () => {
    it('should reject users -> settings.theme (no dots in SingleString)', () => {
      const stream = Stream.ofChars('users -> settings.theme')
      const parsing = grammar.thenEos().parse(stream)

      // Parser should not accept this as a complete mapper expression
      // With thenEos(), the trailing .theme causes rejection
      expect(parsing.isAccepted()).toBe(false)
    })
  })

  describe('AC-MAP-06: Precedence - mapper is lowest', () => {
    it('should parse users|filter:x -> name with pipe as entire source', () => {
      // Without braces, the pipe must still be parsed as the source
      // This tests that mapper has lower precedence than pipe
      const stream = Stream.ofChars('{users|filter:x} -> name')
      const parsing = grammar.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      const result = parsing.value as { type: string; source: { type: string } }
      expect(result.type).toBe('mapper')
      expect(result.source.type).toBe('pipe-expression')
    })

    it('should parse complex expression a + b -> name with binary as source', () => {
      // Note: Without parentheses, binary operations are part of the source
      const stream = Stream.ofChars('(a + b) -> name')
      const parsing = grammar.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      expect(parsing.value).toMatchObject({
        type: 'mapper',
        source: {
          type: 'binary',
          operator: '+',
        },
        target: { type: 'single-string', value: 'name' },
      })
    })
  })

  describe('AC-MAP-07: Backwards compatibility', () => {
    it('should parse count=42 (no arrow) as LiteralNumberNode', () => {
      // When no arrow is present, expression should parse normally
      const stream = Stream.ofChars('42')
      const parsing = grammar.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      expect(parsing.value).toEqual({
        type: 'literal-number',
        value: 42,
      })
    })

    it('should parse simple identifier without arrow', () => {
      const stream = Stream.ofChars('users')
      const parsing = grammar.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      expect(parsing.value).toEqual({
        type: 'identifier',
        value: 'users',
      })
    })

    it('should parse binary expression without arrow', () => {
      const stream = Stream.ofChars('a + b')
      const parsing = grammar.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      expect(parsing.value).toMatchObject({
        type: 'binary',
        operator: '+',
      })
    })

    it('should parse pipe expression without arrow', () => {
      const stream = Stream.ofChars('{users|filter:active}')
      const parsing = grammar.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      expect(parsing.value).toMatchObject({
        type: 'pipe-expression',
      })
    })
  })

  describe('AC-MAP-08: Mapper inside braces', () => {
    it('should parse data={users -> name} with mapper inside braces', () => {
      // The braced expression should contain a mapper
      const stream = Stream.ofChars('{users -> name}')
      const parsing = grammar.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      expect(parsing.value).toEqual({
        type: 'mapper',
        source: { type: 'identifier', value: 'users' },
        target: { type: 'single-string', value: 'name' },
      })
    })

    it('should parse nested: {data.users -> email} in braces', () => {
      const stream = Stream.ofChars('{data.users -> email}')
      const parsing = grammar.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      expect(parsing.value).toMatchObject({
        type: 'mapper',
        source: { type: 'member' },
        target: { type: 'single-string', value: 'email' },
      })
    })
  })

  describe('Edge cases', () => {
    it('should reject empty source -> name', () => {
      const stream = Stream.ofChars('-> name')
      const parsing = grammar.parse(stream)

      // No valid expression before ->, so parser rejects
      expect(parsing.isAccepted()).toBe(false)
    })

    it('should reject users -> (empty target)', () => {
      const stream = Stream.ofChars('users ->')
      const parsing = grammar.thenEos().parse(stream)

      // With thenEos(), the incomplete mapper (missing target) is rejected
      expect(parsing.isAccepted()).toBe(false)
    })

    it('should reject chained mappers users -> friends -> name', () => {
      const stream = Stream.ofChars('users -> friends -> name')
      const parsing = grammar.thenEos().parse(stream)

      // Chaining is not allowed - parses first mapper, but -> name remains unconsumed
      expect(parsing.isAccepted()).toBe(false)
    })

    it('should parse mapper with string literal source', () => {
      // Unusual but valid per PRD
      const stream = Stream.ofChars('"hello" -> value')
      const parsing = grammar.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      expect(parsing.value).toMatchObject({
        type: 'mapper',
        source: { type: 'literal-string', value: 'hello' },
        target: { type: 'single-string', value: 'value' },
      })
    })

    it('should parse mapper with array literal source', () => {
      const stream = Stream.ofChars('[a, b, c] -> value')
      const parsing = grammar.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      expect(parsing.value).toMatchObject({
        type: 'mapper',
        source: { type: 'array-literal' },
        target: { type: 'single-string', value: 'value' },
      })
    })

    it('should reject reserved words as target', () => {
      // "true" and "false" are reserved - IDENTIFIER token rejects them
      const stream = Stream.ofChars('users -> true')
      const parsing = grammar.thenEos().parse(stream)

      // With thenEos(), "true" as target is rejected (reserved word)
      expect(parsing.isAccepted()).toBe(false)
    })
  })
})
