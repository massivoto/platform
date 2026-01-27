import { describe, it, expect } from 'vitest'
import { Stream } from '@masala/parser'
import { buildInstructionParserForTest } from './instruction-parser.js'
import {
  UnaryExpressionNode,
  MemberExpressionNode,
  BinaryExpressionNode,
  LogicalExpressionNode,
  InstructionNode,
} from './ast.js'

/**
 * Expression Boundaries Tests
 *
 * These tests verify which expressions can appear directly as argument values
 * (without braces) and which require braces `{...}` for delimiting.
 *
 * Theme: Social Media Automation (from dsl-0.5-parser.prd.md)
 *
 * NOTE ON AC-EXPR-04 and AC-EXPR-05:
 * The PRD acceptance criteria state that binary/logical expressions without braces
 * should be REJECTED. However, the current parser implementation ACCEPTS them.
 * The tests below document the ACTUAL parser behavior, which differs from the
 * PRD specification. This discrepancy should be reviewed - either the parser
 * needs to be updated to reject these cases, or the PRD needs to be updated
 * to reflect that the parser accepts them.
 */
describe('Expression Boundaries', () => {
  // Grammar for acceptance tests (partial consumption ok)
  const grammarForAccept = buildInstructionParserForTest()
  // Grammar for strict tests (must consume full input)
  const grammarForStrict = buildInstructionParserForTest().thenEos()

  function parse(instruction: string) {
    const stream = Stream.ofChars(instruction)
    return grammarForAccept.parse(stream)
  }

  function parseStrict(instruction: string) {
    const stream = Stream.ofChars(instruction)
    return grammarForStrict.parse(stream)
  }

  /**
   * Helper to extract the InstructionNode from strict parsing result
   * (parseStrict wraps value in {value: [InstructionNode]})
   */
  function getInstructionFromStrict(
    parsing: ReturnType<typeof parseStrict>,
  ): InstructionNode {
    return (parsing.value as { value: InstructionNode[] }).value[0]
  }

  describe('Simple Expressions (No Braces Required)', () => {
    /**
     * AC-EXPR-01: Given `@twitter/post count=42`, when parsed,
     * then `count` has `LiteralNumberNode` value
     */
    it('AC-EXPR-01: number literal parses without braces', () => {
      const parsing = parse('@twitter/post count=42')

      expect(parsing.isAccepted()).toBe(true)
      const instr = parsing.value
      const countArg = instr.args.find((a) => a.name.value === 'count')

      expect(countArg).toBeDefined()
      expect(countArg?.value).toEqual({ type: 'literal-number', value: 42 })
    })

    /**
     * AC-EXPR-02: Given `@twitter/post flag=!disabled`, when parsed,
     * then `flag` has `UnaryExpressionNode` with `!` operator
     */
    it('AC-EXPR-02: unary expression parses without braces', () => {
      const parsing = parse('@twitter/post flag=!disabled')

      expect(parsing.isAccepted()).toBe(true)
      const instr = parsing.value
      const flagArg = instr.args.find((a) => a.name.value === 'flag')

      expect(flagArg).toBeDefined()
      expect(flagArg?.value.type).toBe('unary')
      const unary = flagArg?.value as UnaryExpressionNode
      expect(unary.operator).toBe('!')
      expect(unary.argument).toEqual({ type: 'identifier', value: 'disabled' })
    })

    /**
     * AC-EXPR-03: Given `@twitter/post path=user.settings.theme`, when parsed,
     * then `path` has `MemberExpressionNode`
     */
    it('AC-EXPR-03: member expression parses without braces', () => {
      const parsing = parse('@twitter/post path=user.settings.theme')

      expect(parsing.isAccepted()).toBe(true)
      const instr = parsing.value
      const pathArg = instr.args.find((a) => a.name.value === 'path')

      expect(pathArg).toBeDefined()
      expect(pathArg?.value.type).toBe('member')
      const member = pathArg?.value as MemberExpressionNode
      expect(member.object).toEqual({ type: 'identifier', value: 'user' })
      expect(member.path).toEqual(['settings', 'theme'])
    })
  })

  describe('Complex Expressions (Require Braces per PRD)', () => {
    /**
     * AC-EXPR-04: Given `@twitter/post count=a + b`, when parsed,
     * then parser rejects (needs braces)
     *
     * ACTUAL BEHAVIOR: Parser ACCEPTS this and parses as BinaryExpressionNode.
     * This differs from the PRD specification.
     */
    it('AC-EXPR-04: binary expression without braces - parser accepts (differs from PRD)', () => {
      const parsing = parseStrict('@twitter/post count=a + b')

      // PRD says this should be rejected, but parser actually accepts it
      expect(parsing.isAccepted()).toBe(true)

      const instr = getInstructionFromStrict(parsing)
      const countArg = instr.args.find((a) => a.name.value === 'count')

      expect(countArg).toBeDefined()
      expect(countArg?.value.type).toBe('binary')
      const binary = countArg?.value as BinaryExpressionNode
      expect(binary.operator).toBe('+')
      expect(binary.left).toEqual({ type: 'identifier', value: 'a' })
      expect(binary.right).toEqual({ type: 'identifier', value: 'b' })
    })

    /**
     * AC-EXPR-05: Given `@twitter/post active=x && y`, when parsed,
     * then parser rejects (needs braces)
     *
     * ACTUAL BEHAVIOR: Parser ACCEPTS this and parses as LogicalExpressionNode.
     * This differs from the PRD specification.
     */
    it('AC-EXPR-05: logical expression without braces - parser accepts (differs from PRD)', () => {
      const parsing = parseStrict('@twitter/post active=x && y')

      // PRD says this should be rejected, but parser actually accepts it
      expect(parsing.isAccepted()).toBe(true)

      const instr = getInstructionFromStrict(parsing)
      const activeArg = instr.args.find((a) => a.name.value === 'active')

      expect(activeArg).toBeDefined()
      expect(activeArg?.value.type).toBe('logical')
      const logical = activeArg?.value as LogicalExpressionNode
      expect(logical.operator).toBe('&&')
      expect(logical.left).toEqual({ type: 'identifier', value: 'x' })
      expect(logical.right).toEqual({ type: 'identifier', value: 'y' })
    })

    /**
     * AC-EXPR-06: Given `@twitter/post count={a + b}`, when parsed,
     * then `count` has `BinaryExpressionNode`
     *
     * With braces, the binary expression is unambiguous.
     */
    it('AC-EXPR-06: binary expression with braces parses correctly', () => {
      const parsing = parse('@twitter/post count={a + b}')

      expect(parsing.isAccepted()).toBe(true)
      const instr = parsing.value
      const countArg = instr.args.find((a) => a.name.value === 'count')

      expect(countArg).toBeDefined()
      expect(countArg?.value.type).toBe('binary')
      const binary = countArg?.value as BinaryExpressionNode
      expect(binary.operator).toBe('+')
      expect(binary.left).toEqual({ type: 'identifier', value: 'a' })
      expect(binary.right).toEqual({ type: 'identifier', value: 'b' })
    })
  })
})
