import { describe, it, expect } from 'vitest'
import {
  GenlexTracer,
  SingleParser,
  Stream,
  TracingGenLex,
} from '@masala/parser'
import { ArrayLiteralNode, ExpressionNode } from '../ast.js'
import { createExpressionWithPipe } from './full-expression-parser.js'
import { createArgumentTokens } from './tokens/argument-tokens.js'

let tracer: GenlexTracer
function buildExpressionParser(): SingleParser<ExpressionNode> {
  const genlex = new TracingGenLex()
  tracer = genlex.tracer
  const tokens = createArgumentTokens(genlex)
  const grammar = createExpressionWithPipe(tokens)
  return genlex.use(grammar)
}

describe('Array literal parser', () => {
  const parser = buildExpressionParser()

  describe('R-ARR-01: Array literals use bracket syntax', () => {
    it('should parse [1, 2, 3]', () => {
      const stream = Stream.ofChars('[1, 2, 3]')
      const parsing = parser.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      const result = parsing.value as ArrayLiteralNode
      expect(result.type).toBe('array-literal')
      expect(result.elements).toHaveLength(3)
    })
  })

  describe('R-ARR-02: Elements separated by commas', () => {
    it('should parse [1, 2, 3] with spaces', () => {
      const stream = Stream.ofChars('[1, 2, 3]')
      const parsing = parser.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      const result = parsing.value as ArrayLiteralNode
      expect(result.elements).toHaveLength(3)
    })

    it('should parse [1,2,3] without spaces', () => {
      const stream = Stream.ofChars('[1,2,3]')
      const parsing = parser.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      const result = parsing.value as ArrayLiteralNode
      expect(result.elements).toHaveLength(3)
    })
  })

  describe('R-ARR-03: Empty arrays are valid', () => {
    it('should parse []', () => {
      const stream = Stream.ofChars('[]')
      const parsing = parser.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      const result = parsing.value as ArrayLiteralNode
      expect(result.type).toBe('array-literal')
      expect(result.elements).toHaveLength(0)
    })
  })

  describe('R-ARR-04: Trailing commas are NOT allowed', () => {
    it('should reject [1, 2,]', () => {
      const stream = Stream.ofChars('[1, 2,]')
      const parsing = parser.thenEos().parse(stream)

      expect(parsing.isAccepted()).toBe(false)
    })
  })

  describe('R-ARR-21: Elements can be any expression type', () => {
    it('should parse array with number literals', () => {
      const stream = Stream.ofChars('[1, 2, 3]')
      const parsing = parser.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      const result = parsing.value as ArrayLiteralNode
      expect(result.elements[0]).toEqual({ type: 'literal-number', value: 1 })
      expect(result.elements[1]).toEqual({ type: 'literal-number', value: 2 })
      expect(result.elements[2]).toEqual({ type: 'literal-number', value: 3 })
    })

    it('should parse array with string literals', () => {
      const stream = Stream.ofChars('["a", "b", "c"]')
      const parsing = parser.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      const result = parsing.value as ArrayLiteralNode
      expect(result.elements[0]).toEqual({ type: 'literal-string', value: 'a' })
      expect(result.elements[1]).toEqual({ type: 'literal-string', value: 'b' })
      expect(result.elements[2]).toEqual({ type: 'literal-string', value: 'c' })
    })

    it('should parse array with boolean literals', () => {
      const stream = Stream.ofChars('[true, false]')
      const parsing = parser.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      const result = parsing.value as ArrayLiteralNode
      expect(result.elements[0]).toEqual({
        type: 'literal-boolean',
        value: true,
      })
      expect(result.elements[1]).toEqual({
        type: 'literal-boolean',
        value: false,
      })
    })

    it('should parse array with identifiers', () => {
      const stream = Stream.ofChars('[a, b, c]')
      const parsing = parser.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      const result = parsing.value as ArrayLiteralNode
      expect(result.elements[0]).toEqual({ type: 'identifier', value: 'a' })
      expect(result.elements[1]).toEqual({ type: 'identifier', value: 'b' })
      expect(result.elements[2]).toEqual({ type: 'identifier', value: 'c' })
    })

    it('should parse array with member expressions', () => {
      const stream = Stream.ofChars('[user.name, user.email]')
      const parsing = parser.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      const result = parsing.value as ArrayLiteralNode
      expect(result.elements[0]).toMatchObject({
        type: 'member',
        path: ['name'],
      })
      expect(result.elements[1]).toMatchObject({
        type: 'member',
        path: ['email'],
      })
    })

    it('should parse array with binary expressions', () => {
      const stream = Stream.ofChars('[a + b, c * 2]')
      const parsing = parser.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      const result = parsing.value as ArrayLiteralNode
      expect(result.elements[0]).toMatchObject({
        type: 'binary',
        operator: '+',
      })
      expect(result.elements[1]).toMatchObject({
        type: 'binary',
        operator: '*',
      })
    })

    it('should parse array with logical expressions', () => {
      const stream = Stream.ofChars('[a && b, c || d]')
      const parsing = parser.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      const result = parsing.value as ArrayLiteralNode
      expect(result.elements[0]).toMatchObject({
        type: 'logical',
        operator: '&&',
      })
      expect(result.elements[1]).toMatchObject({
        type: 'logical',
        operator: '||',
      })
    })

    it('should parse array with unary expressions', () => {
      const stream = Stream.ofChars('[!a, -b, +c]')
      const parsing = parser.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      const result = parsing.value as ArrayLiteralNode
      expect(result.elements[0]).toMatchObject({ type: 'unary', operator: '!' })
      expect(result.elements[1]).toMatchObject({ type: 'unary', operator: '-' })
      expect(result.elements[2]).toMatchObject({ type: 'unary', operator: '+' })
    })
  })

  describe('R-ARR-22: Mixed element types allowed', () => {
    it('should parse [1, "two", true, user.name]', () => {
      const stream = Stream.ofChars('[1, "two", true, user.name]')
      const parsing = parser.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      const result = parsing.value as ArrayLiteralNode
      expect(result.elements).toHaveLength(4)
      expect(result.elements[0]).toEqual({ type: 'literal-number', value: 1 })
      expect(result.elements[1]).toEqual({
        type: 'literal-string',
        value: 'two',
      })
      expect(result.elements[2]).toEqual({
        type: 'literal-boolean',
        value: true,
      })
      expect(result.elements[3]).toMatchObject({
        type: 'member',
        path: ['name'],
      })
    })
  })

  describe('R-ARR-23: Nested arrays allowed', () => {
    it('should parse [[1, 2], [3, 4]]', () => {
      const stream = Stream.ofChars('[[1, 2], [3, 4]]')
      const parsing = parser.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      const result = parsing.value as ArrayLiteralNode
      expect(result.type).toBe('array-literal')
      expect(result.elements).toHaveLength(2)

      const inner1 = result.elements[0] as ArrayLiteralNode
      expect(inner1.type).toBe('array-literal')
      expect(inner1.elements).toHaveLength(2)

      const inner2 = result.elements[1] as ArrayLiteralNode
      expect(inner2.type).toBe('array-literal')
      expect(inner2.elements).toHaveLength(2)
    })

    it('should parse deeply nested arrays', () => {
      const stream = Stream.ofChars('[[[1]]]')
      const parsing = parser.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      const result = parsing.value as ArrayLiteralNode
      expect(result.type).toBe('array-literal')

      const level2 = result.elements[0] as ArrayLiteralNode
      expect(level2.type).toBe('array-literal')

      const level3 = level2.elements[0] as ArrayLiteralNode
      expect(level3.type).toBe('array-literal')
      expect(level3.elements[0]).toEqual({ type: 'literal-number', value: 1 })
    })
  })

  describe('R-ARR-24: Sparse arrays rejected', () => {
    it('should reject [1, , 3]', () => {
      const stream = Stream.ofChars('[1, , 3]')
      const parsing = parser.thenEos().parse(stream)

      expect(parsing.isAccepted()).toBe(false)
    })
  })

  describe('Arrays in expressions', () => {
    it('should parse array as pipe input: {[1,2,3]|filter}', () => {
      const stream = Stream.ofChars('{[1,2,3]|filter}')
      const parsing = parser.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      expect(parsing.value).toMatchObject({
        type: 'pipe-expression',
        input: { type: 'array-literal' },
      })
    })

    it('should parse array in parentheses: ([1, 2])', () => {
      const stream = Stream.ofChars('([1, 2])')
      const parsing = parser.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      const result = parsing.value as ArrayLiteralNode
      expect(result.type).toBe('array-literal')
    })
  })

  describe('Acceptance Criteria', () => {
    it('AC-ARR-01: tags=["tech", "ai"] has 2 string elements', () => {
      const stream = Stream.ofChars('["tech", "ai"]')
      const parsing = parser.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      const result = parsing.value as ArrayLiteralNode
      expect(result.type).toBe('array-literal')
      expect(result.elements).toHaveLength(2)
      expect(result.elements[0]).toEqual({
        type: 'literal-string',
        value: 'tech',
      })
      expect(result.elements[1]).toEqual({
        type: 'literal-string',
        value: 'ai',
      })
    })

    it('AC-ARR-02: ids=[1, 2, 3] has 3 number elements', () => {
      const stream = Stream.ofChars('[1, 2, 3]')
      const parsing = parser.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      const result = parsing.value as ArrayLiteralNode
      expect(result.type).toBe('array-literal')
      expect(result.elements).toHaveLength(3)
      expect(result.elements[0]).toEqual({ type: 'literal-number', value: 1 })
      expect(result.elements[1]).toEqual({ type: 'literal-number', value: 2 })
      expect(result.elements[2]).toEqual({ type: 'literal-number', value: 3 })
    })

    it('AC-ARR-03: scores=[a + b, c * 2] has 2 BinaryExpressionNode elements', () => {
      const stream = Stream.ofChars('[a + b, c * 2]')
      const parsing = parser.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      const result = parsing.value as ArrayLiteralNode
      expect(result.elements).toHaveLength(2)
      expect(result.elements[0]).toMatchObject({
        type: 'binary',
        operator: '+',
      })
      expect(result.elements[1]).toMatchObject({
        type: 'binary',
        operator: '*',
      })
    })

    it('AC-ARR-04: data=[[1, 2], [3, 4]] has nested ArrayLiteralNode structure', () => {
      const stream = Stream.ofChars('[[1, 2], [3, 4]]')
      const parsing = parser.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      const result = parsing.value as ArrayLiteralNode
      expect(result.type).toBe('array-literal')
      expect(result.elements[0]).toMatchObject({ type: 'array-literal' })
      expect(result.elements[1]).toMatchObject({ type: 'array-literal' })
    })

    it('AC-ARR-05: list=[] has empty elements array', () => {
      const stream = Stream.ofChars('[]')
      const parsing = parser.parse(stream)

      expect(parsing.isAccepted()).toBe(true)
      const result = parsing.value as ArrayLiteralNode
      expect(result.type).toBe('array-literal')
      expect(result.elements).toEqual([])
    })

    it('AC-ARR-06: list=[1, 2,] is rejected (trailing comma)', () => {
      const stream = Stream.ofChars('[1, 2,]')
      const parsing = parser.thenEos().parse(stream)

      expect(parsing.isAccepted()).toBe(false)
    })
  })
})
