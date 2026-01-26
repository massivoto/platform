import { describe, it, expect, beforeAll } from 'vitest'
import {
  IdentifierNode,
  LiteralStringNode,
  LiteralNumberNode,
  LiteralBooleanNode,
  LiteralNullNode,
  MemberExpressionNode,
  UnaryExpressionNode,
  BinaryExpressionNode,
  LogicalExpressionNode,
  ArrayLiteralNode,
  ExpressionNode,
} from '../parser/ast.js'
import { ExpressionEvaluator, EvaluationError } from './evaluators.js'
import {
  ExecutionContext,
  fromPartialContext,
} from '../../domain/execution-context.js'
import { createEmptyScopeChain, pushScope, write } from './scope-chain.js'

const evaluator = new ExpressionEvaluator()

// Theme: Social Media Automation
// Note: Using 'as any' for value: null since SerializableObject doesn't include null in Primitive
// but evaluator must handle null values at runtime (they come from external data)
const socialMediaContext: ExecutionContext = fromPartialContext({
  data: {
    user: {
      name: 'Emma',
      followers: 1500,
      isVerified: true,
      profile: {
        bio: 'Tech enthusiast',
        settings: {
          theme: 'dark',
          notifications: true,
        },
      },
    },
    posts: [
      { id: 'p1', likes: 100 },
      { id: 'p2', likes: 250 },
    ],
    count: 42,
    price: 10,
    quantity: 5,
    isActive: true,
    hasAccess: true,
    message: 'hello',
    emptyMessage: '',
    value: null as any, // null needed for truthy/falsy tests
    items: [],
  },
  user: {
    id: 'emma@social.com',
    extra: {},
  },
})

// ============================================================================
// LITERAL NODES (R-EVAL-01, R-EVAL-02)
// ============================================================================

describe('ExpressionEvaluator - Literal Nodes', () => {
  describe('R-EVAL-01: literal-null', () => {
    it('should evaluate literal-null node to null', async () => {
      const expr: LiteralNullNode = { type: 'literal-null', value: null }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(null)
    })
  })

  describe('R-EVAL-02: existing literals still work', () => {
    it('should evaluate literal-string', async () => {
      const expr: LiteralStringNode = { type: 'literal-string', value: 'hello' }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe('hello')
    })

    it('should evaluate literal-number', async () => {
      const expr: LiteralNumberNode = { type: 'literal-number', value: 42 }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(42)
    })

    it('should evaluate literal-boolean true', async () => {
      const expr: LiteralBooleanNode = { type: 'literal-boolean', value: true }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })

    it('should evaluate literal-boolean false', async () => {
      const expr: LiteralBooleanNode = { type: 'literal-boolean', value: false }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(false)
    })

    it('should evaluate identifier', async () => {
      const expr: IdentifierNode = { type: 'identifier', value: 'count' }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(42)
    })
  })
})

// ============================================================================
// MEMBER ACCESS (R-EVAL-21 to R-EVAL-23)
// ============================================================================

describe('ExpressionEvaluator - Member Access', () => {
  describe('R-EVAL-21: member with identifier object', () => {
    // AC-EVAL-01: Given context { user: { name: "Emma", followers: 1500 } },
    // when evaluating user.name, then result is "Emma"
    it('should evaluate user.name to "Emma"', async () => {
      const expr: MemberExpressionNode = {
        type: 'member',
        object: { type: 'identifier', value: 'user' },
        path: ['name'],
        computed: false,
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe('Emma')
    })

    it('should evaluate user.followers to 1500', async () => {
      const expr: MemberExpressionNode = {
        type: 'member',
        object: { type: 'identifier', value: 'user' },
        path: ['followers'],
        computed: false,
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(1500)
    })

    it('should evaluate user.isVerified to true', async () => {
      const expr: MemberExpressionNode = {
        type: 'member',
        object: { type: 'identifier', value: 'user' },
        path: ['isVerified'],
        computed: false,
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })
  })

  describe('R-EVAL-22: nested member path', () => {
    it('should evaluate user.profile.bio', async () => {
      const expr: MemberExpressionNode = {
        type: 'member',
        object: { type: 'identifier', value: 'user' },
        path: ['profile', 'bio'],
        computed: false,
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(
        'Tech enthusiast',
      )
    })

    it('should evaluate user.profile.settings.theme to "dark"', async () => {
      const expr: MemberExpressionNode = {
        type: 'member',
        object: { type: 'identifier', value: 'user' },
        path: ['profile', 'settings', 'theme'],
        computed: false,
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe('dark')
    })
  })

  describe('R-EVAL-23: missing properties return undefined', () => {
    // AC-EVAL-02: Given context { user: {} }, when evaluating user.profile.name,
    // then result is undefined (no error)
    it('should return undefined for missing property (no error)', async () => {
      const contextWithEmptyUser = fromPartialContext({
        data: { user: {} },
        user: { id: 'test', extra: {} },
      })
      const expr: MemberExpressionNode = {
        type: 'member',
        object: { type: 'identifier', value: 'user' },
        path: ['profile', 'name'],
        computed: false,
      }
      expect(await evaluator.evaluate(expr, contextWithEmptyUser)).toBe(
        undefined,
      )
    })

    it('should return undefined for deeply missing property', async () => {
      const expr: MemberExpressionNode = {
        type: 'member',
        object: { type: 'identifier', value: 'user' },
        path: ['nonexistent', 'deep', 'path'],
        computed: false,
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(undefined)
    })
  })
})

// ============================================================================
// UNARY OPERATORS (R-EVAL-41 to R-EVAL-44)
// ============================================================================

describe('ExpressionEvaluator - Unary Operators', () => {
  describe('R-EVAL-41: logical NOT (!)', () => {
    // AC-EVAL-03: Given context { isVerified: false }, when evaluating !isVerified, then result is true
    it('should evaluate !false to true', async () => {
      const contextWithFalseVerified = fromPartialContext({
        data: { isVerified: false },
        user: { id: 'test', extra: {} },
      })
      const expr: UnaryExpressionNode = {
        type: 'unary',
        operator: '!',
        argument: { type: 'identifier', value: 'isVerified' },
      }
      expect(await evaluator.evaluate(expr, contextWithFalseVerified)).toBe(
        true,
      )
    })

    // AC-EVAL-04: Given context { isVerified: true }, when evaluating !isVerified, then result is false
    it('should evaluate !true to false', async () => {
      const expr: UnaryExpressionNode = {
        type: 'unary',
        operator: '!',
        argument: { type: 'identifier', value: 'isActive' },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(false)
    })

    // AC-EVAL-05: Given context { count: 0 }, when evaluating !count, then result is true (0 is falsy)
    it('should evaluate !0 to true (0 is falsy)', async () => {
      const contextWithZero = fromPartialContext({
        data: { count: 0 },
        user: { id: 'test', extra: {} },
      })
      const expr: UnaryExpressionNode = {
        type: 'unary',
        operator: '!',
        argument: { type: 'identifier', value: 'count' },
      }
      expect(await evaluator.evaluate(expr, contextWithZero)).toBe(true)
    })

    // AC-EVAL-06: Given context { count: 42 }, when evaluating !count, then result is false
    it('should evaluate !42 to false (non-zero is truthy)', async () => {
      const expr: UnaryExpressionNode = {
        type: 'unary',
        operator: '!',
        argument: { type: 'identifier', value: 'count' },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(false)
    })

    // AC-EVAL-07: Given context { message: "" }, when evaluating !message, then result is true
    it('should evaluate !"" to true (empty string is falsy)', async () => {
      const expr: UnaryExpressionNode = {
        type: 'unary',
        operator: '!',
        argument: { type: 'identifier', value: 'emptyMessage' },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })

    // AC-EVAL-08: Given context { message: "hello" }, when evaluating !message, then result is false
    it('should evaluate !"hello" to false (non-empty string is truthy)', async () => {
      const expr: UnaryExpressionNode = {
        type: 'unary',
        operator: '!',
        argument: { type: 'identifier', value: 'message' },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(false)
    })

    // AC-EVAL-09: Given context { value: null }, when evaluating !value, then result is true
    it('should evaluate !null to true (null is falsy)', async () => {
      const expr: UnaryExpressionNode = {
        type: 'unary',
        operator: '!',
        argument: { type: 'identifier', value: 'value' },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })

    // AC-EVAL-10: Given context { items: [] }, when evaluating !items, then result is false
    it('should evaluate ![] to false (arrays are truthy)', async () => {
      const expr: UnaryExpressionNode = {
        type: 'unary',
        operator: '!',
        argument: { type: 'identifier', value: 'items' },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(false)
    })
  })

  describe('R-EVAL-42: numeric negation (-)', () => {
    it('should evaluate -42 to -42', async () => {
      const expr: UnaryExpressionNode = {
        type: 'unary',
        operator: '-',
        argument: { type: 'literal-number', value: 42 },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(-42)
    })

    it('should evaluate -count (42) to -42', async () => {
      const expr: UnaryExpressionNode = {
        type: 'unary',
        operator: '-',
        argument: { type: 'identifier', value: 'count' },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(-42)
    })
  })

  describe('R-EVAL-43: numeric coercion (+)', () => {
    it('should evaluate +42 to 42', async () => {
      const expr: UnaryExpressionNode = {
        type: 'unary',
        operator: '+',
        argument: { type: 'literal-number', value: 42 },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(42)
    })

    it('should evaluate +"5" to 5 (string coercion)', async () => {
      const contextWithStringNum = fromPartialContext({
        data: { strNum: '5' },
        user: { id: 'test', extra: {} },
      })
      const expr: UnaryExpressionNode = {
        type: 'unary',
        operator: '+',
        argument: { type: 'identifier', value: 'strNum' },
      }
      expect(await evaluator.evaluate(expr, contextWithStringNum)).toBe(5)
    })
  })

  describe('R-EVAL-44: nested unary', () => {
    it('should evaluate !!true to true', async () => {
      const expr: UnaryExpressionNode = {
        type: 'unary',
        operator: '!',
        argument: {
          type: 'unary',
          operator: '!',
          argument: { type: 'literal-boolean', value: true },
        },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })

    it('should evaluate !!false to false', async () => {
      const expr: UnaryExpressionNode = {
        type: 'unary',
        operator: '!',
        argument: {
          type: 'unary',
          operator: '!',
          argument: { type: 'literal-boolean', value: false },
        },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(false)
    })

    it('should evaluate --5 to 5', async () => {
      const expr: UnaryExpressionNode = {
        type: 'unary',
        operator: '-',
        argument: {
          type: 'unary',
          operator: '-',
          argument: { type: 'literal-number', value: 5 },
        },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(5)
    })
  })
})

// ============================================================================
// BINARY OPERATORS (R-EVAL-61 to R-EVAL-64)
// ============================================================================

describe('ExpressionEvaluator - Binary Operators', () => {
  describe('R-EVAL-61: comparison operators', () => {
    // AC-EVAL-11: Given context { user: { followers: 1500 } },
    // when evaluating user.followers > 1000, then result is true
    it('should evaluate user.followers > 1000 to true', async () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '>',
        left: {
          type: 'member',
          object: { type: 'identifier', value: 'user' },
          path: ['followers'],
          computed: false,
        },
        right: { type: 'literal-number', value: 1000 },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })

    it('should evaluate 5 == 5 to true (strict equality)', async () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '==',
        left: { type: 'literal-number', value: 5 },
        right: { type: 'literal-number', value: 5 },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })

    it('should evaluate 5 == "5" to false (strict equality, no coercion)', async () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '==',
        left: { type: 'literal-number', value: 5 },
        right: { type: 'literal-string', value: '5' },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(false)
    })

    it('should evaluate null == null to true', async () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '==',
        left: { type: 'literal-null', value: null },
        right: { type: 'literal-null', value: null },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })

    it('should evaluate null == undefined to false (strict)', async () => {
      const contextWithUndef = fromPartialContext({
        data: { undef: undefined },
        user: { id: 'test', extra: {} },
      })
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '==',
        left: { type: 'literal-null', value: null },
        right: { type: 'identifier', value: 'undef' },
      }
      expect(await evaluator.evaluate(expr, contextWithUndef)).toBe(false)
    })

    it('should evaluate 5 != 3 to true', async () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '!=',
        left: { type: 'literal-number', value: 5 },
        right: { type: 'literal-number', value: 3 },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })

    it('should evaluate 5 < 10 to true', async () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '<',
        left: { type: 'literal-number', value: 5 },
        right: { type: 'literal-number', value: 10 },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })

    it('should evaluate 5 <= 5 to true', async () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '<=',
        left: { type: 'literal-number', value: 5 },
        right: { type: 'literal-number', value: 5 },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })

    it('should evaluate 10 > 5 to true', async () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '>',
        left: { type: 'literal-number', value: 10 },
        right: { type: 'literal-number', value: 5 },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })

    it('should evaluate 5 >= 5 to true', async () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '>=',
        left: { type: 'literal-number', value: 5 },
        right: { type: 'literal-number', value: 5 },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })
  })

  describe('R-EVAL-62: arithmetic operators', () => {
    // AC-EVAL-12: Given context { price: 10, quantity: 5 },
    // when evaluating price * quantity, then result is 50
    it('should evaluate price * quantity to 50', async () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '*',
        left: { type: 'identifier', value: 'price' },
        right: { type: 'identifier', value: 'quantity' },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(50)
    })

    it('should evaluate 5 + 3 to 8', async () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '+',
        left: { type: 'literal-number', value: 5 },
        right: { type: 'literal-number', value: 3 },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(8)
    })

    it('should evaluate "hello" + " world" to "hello world" (string concatenation)', async () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '+',
        left: { type: 'literal-string', value: 'hello' },
        right: { type: 'literal-string', value: ' world' },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(
        'hello world',
      )
    })

    it('should evaluate 10 - 3 to 7', async () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '-',
        left: { type: 'literal-number', value: 10 },
        right: { type: 'literal-number', value: 3 },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(7)
    })

    it('should evaluate 10 / 2 to 5', async () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '/',
        left: { type: 'literal-number', value: 10 },
        right: { type: 'literal-number', value: 2 },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(5)
    })

    it('should evaluate 10 / 0 to Infinity (JS semantics)', async () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '/',
        left: { type: 'literal-number', value: 10 },
        right: { type: 'literal-number', value: 0 },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(Infinity)
    })

    it('should evaluate -10 / 0 to -Infinity (JS semantics)', async () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '/',
        left: { type: 'literal-number', value: -10 },
        right: { type: 'literal-number', value: 0 },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(-Infinity)
    })

    it('should evaluate 10 % 3 to 1', async () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '%',
        left: { type: 'literal-number', value: 10 },
        right: { type: 'literal-number', value: 3 },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(1)
    })
  })

  describe('R-EVAL-63: nested binary (AST structure)', () => {
    it('should evaluate (a + b) * c respecting AST structure', async () => {
      // (5 + 3) * 2 = 16
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '*',
        left: {
          type: 'binary',
          operator: '+',
          left: { type: 'literal-number', value: 5 },
          right: { type: 'literal-number', value: 3 },
        },
        right: { type: 'literal-number', value: 2 },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(16)
    })
  })

  describe('R-EVAL-64: mixed binary inside logical', () => {
    it('should evaluate count > 0 && count < 100', async () => {
      // count is 42, so 42 > 0 && 42 < 100 = true
      const expr: LogicalExpressionNode = {
        type: 'logical',
        operator: '&&',
        left: {
          type: 'binary',
          operator: '>',
          left: { type: 'identifier', value: 'count' },
          right: { type: 'literal-number', value: 0 },
        },
        right: {
          type: 'binary',
          operator: '<',
          left: { type: 'identifier', value: 'count' },
          right: { type: 'literal-number', value: 100 },
        },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })
  })
})

// ============================================================================
// LOGICAL OPERATORS (R-EVAL-81 to R-EVAL-83)
// ============================================================================

describe('ExpressionEvaluator - Logical Operators', () => {
  describe('R-EVAL-81: && operator with short-circuit', () => {
    // AC-EVAL-13: Given context { hasAccess: true, isActive: true },
    // when evaluating hasAccess && isActive, then result is true
    it('should evaluate true && true to true', async () => {
      const expr: LogicalExpressionNode = {
        type: 'logical',
        operator: '&&',
        left: { type: 'identifier', value: 'hasAccess' },
        right: { type: 'identifier', value: 'isActive' },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })

    it('should evaluate false && anything to false (short-circuit)', async () => {
      const expr: LogicalExpressionNode = {
        type: 'logical',
        operator: '&&',
        left: { type: 'literal-boolean', value: false },
        right: { type: 'literal-boolean', value: true },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(false)
    })

    it('should return first falsy value (short-circuit behavior)', async () => {
      const expr: LogicalExpressionNode = {
        type: 'logical',
        operator: '&&',
        left: { type: 'literal-number', value: 0 },
        right: { type: 'literal-string', value: 'never reached' },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(0)
    })

    it('should return last value if all truthy', async () => {
      const expr: LogicalExpressionNode = {
        type: 'logical',
        operator: '&&',
        left: { type: 'literal-number', value: 5 },
        right: { type: 'literal-string', value: 'result' },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe('result')
    })
  })

  describe('R-EVAL-82: || operator with short-circuit', () => {
    // AC-EVAL-14: Given context { hasAccess: false, isActive: true },
    // when evaluating hasAccess || isActive, then result is true
    it('should evaluate false || true to true', async () => {
      const contextWithFalseAccess = fromPartialContext({
        data: { hasAccess: false, isActive: true },
        user: { id: 'test', extra: {} },
      })
      const expr: LogicalExpressionNode = {
        type: 'logical',
        operator: '||',
        left: { type: 'identifier', value: 'hasAccess' },
        right: { type: 'identifier', value: 'isActive' },
      }
      expect(await evaluator.evaluate(expr, contextWithFalseAccess)).toBe(true)
    })

    it('should evaluate true || anything to true (short-circuit)', async () => {
      const expr: LogicalExpressionNode = {
        type: 'logical',
        operator: '||',
        left: { type: 'literal-boolean', value: true },
        right: { type: 'literal-boolean', value: false },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })

    it('should return first truthy value (short-circuit behavior)', async () => {
      const expr: LogicalExpressionNode = {
        type: 'logical',
        operator: '||',
        left: { type: 'literal-string', value: 'first' },
        right: { type: 'literal-string', value: 'second' },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe('first')
    })

    it('should return last value if all falsy', async () => {
      const expr: LogicalExpressionNode = {
        type: 'logical',
        operator: '||',
        left: { type: 'literal-boolean', value: false },
        right: { type: 'literal-number', value: 0 },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(0)
    })
  })

  describe('R-EVAL-83: nested logical respects AST precedence', () => {
    it('should evaluate a && b || c respecting AST', async () => {
      // (false && true) || true = true
      const expr: LogicalExpressionNode = {
        type: 'logical',
        operator: '||',
        left: {
          type: 'logical',
          operator: '&&',
          left: { type: 'literal-boolean', value: false },
          right: { type: 'literal-boolean', value: true },
        },
        right: { type: 'literal-boolean', value: true },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })
  })
})

// ============================================================================
// ARRAY LITERALS (R-EVAL-101, R-EVAL-102)
// ============================================================================

describe('ExpressionEvaluator - Array Literals', () => {
  describe('R-EVAL-101: array-literal evaluation', () => {
    // AC-EVAL-15: Given expression [1, 2, 3], when evaluated, then result is array [1, 2, 3]
    it('should evaluate [1, 2, 3] to array [1, 2, 3]', async () => {
      const expr: ArrayLiteralNode = {
        type: 'array-literal',
        elements: [
          { type: 'literal-number', value: 1 },
          { type: 'literal-number', value: 2 },
          { type: 'literal-number', value: 3 },
        ],
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toEqual([
        1, 2, 3,
      ])
    })

    it('should evaluate empty array []', async () => {
      const expr: ArrayLiteralNode = {
        type: 'array-literal',
        elements: [],
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toEqual([])
    })

    it('should evaluate mixed type array', async () => {
      const expr: ArrayLiteralNode = {
        type: 'array-literal',
        elements: [
          { type: 'literal-number', value: 1 },
          { type: 'literal-string', value: 'two' },
          { type: 'literal-boolean', value: true },
          { type: 'literal-null', value: null },
        ],
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toEqual([
        1,
        'two',
        true,
        null,
      ])
    })

    it('should evaluate array with identifiers', async () => {
      const expr: ArrayLiteralNode = {
        type: 'array-literal',
        elements: [
          { type: 'identifier', value: 'count' },
          { type: 'identifier', value: 'price' },
        ],
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toEqual([
        42, 10,
      ])
    })
  })

  describe('R-EVAL-102: nested arrays', () => {
    it('should evaluate [[1, 2], [3, 4]]', async () => {
      const expr: ArrayLiteralNode = {
        type: 'array-literal',
        elements: [
          {
            type: 'array-literal',
            elements: [
              { type: 'literal-number', value: 1 },
              { type: 'literal-number', value: 2 },
            ],
          },
          {
            type: 'array-literal',
            elements: [
              { type: 'literal-number', value: 3 },
              { type: 'literal-number', value: 4 },
            ],
          },
        ],
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toEqual([
        [1, 2],
        [3, 4],
      ])
    })
  })
})

// ============================================================================
// ERROR HANDLING (R-EVAL-121 to R-EVAL-123)
// ============================================================================

describe('ExpressionEvaluator - Error Handling', () => {
  describe('R-EVAL-121: unknown node type throws EvaluationError', () => {
    it('should throw EvaluationError for unknown node type', async () => {
      const unknownExpr = {
        type: 'unknown-type',
        value: 'test',
      } as unknown as ExpressionNode
      await expect(
        evaluator.evaluate(unknownExpr, socialMediaContext),
      ).rejects.toThrow(EvaluationError)
    })

    it('should include node type in error message', async () => {
      const unknownExpr = {
        type: 'some-weird-type',
        value: 'test',
      } as unknown as ExpressionNode
      await expect(
        evaluator.evaluate(unknownExpr, socialMediaContext),
      ).rejects.toThrow(/some-weird-type/)
    })
  })

  describe('R-EVAL-122: LLM-readable error messages', () => {
    it('should provide meaningful error context', async () => {
      const unknownExpr = {
        type: 'mystery-node',
        data: { foo: 'bar' },
      } as unknown as ExpressionNode
      try {
        await evaluator.evaluate(unknownExpr, socialMediaContext)
        expect.fail('Should have thrown')
      } catch (e) {
        expect(e).toBeInstanceOf(EvaluationError)
        const err = e as EvaluationError
        expect(err.message).toContain('mystery-node')
      }
    })
  })

  describe('R-EVAL-123: EvaluationError class structure', () => {
    it('should have nodeType property', async () => {
      const unknownExpr = {
        type: 'test-node-type',
        value: 'x',
      } as unknown as ExpressionNode
      try {
        await evaluator.evaluate(unknownExpr, socialMediaContext)
        expect.fail('Should have thrown')
      } catch (e) {
        expect(e).toBeInstanceOf(EvaluationError)
        const err = e as EvaluationError
        expect(err.nodeType).toBe('test-node-type')
      }
    })

    it('should have expression property', async () => {
      const unknownExpr = {
        type: 'test-node',
        value: 'xyz',
      } as unknown as ExpressionNode
      try {
        await evaluator.evaluate(unknownExpr, socialMediaContext)
        expect.fail('Should have thrown')
      } catch (e) {
        expect(e).toBeInstanceOf(EvaluationError)
        const err = e as EvaluationError
        expect(err.expression).toEqual(unknownExpr)
      }
    })

    it('should extend Error', () => {
      const err = new EvaluationError('test message', 'test-type', {
        type: 'test',
      } as any)
      expect(err).toBeInstanceOf(Error)
      expect(err.name).toBe('EvaluationError')
    })
  })

  describe('pipe expressions throw informative error', () => {
    it('should throw EvaluationError for pipe expressions (not yet supported)', async () => {
      const pipeExpr = {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'data' },
        segments: [{ pipeName: 'filter', args: [] }],
      } as unknown as ExpressionNode
      await expect(
        evaluator.evaluate(pipeExpr, socialMediaContext),
      ).rejects.toThrow(EvaluationError)
      await expect(
        evaluator.evaluate(pipeExpr, socialMediaContext),
      ).rejects.toThrow(/pipe/i)
    })
  })
})

// ============================================================================
// VARIABLE RESOLUTION WITH SCOPE CHAIN (R-SCOPE-21 to R-SCOPE-25, R-SCOPE-81 to R-SCOPE-83)
// ============================================================================

describe('ExpressionEvaluator - Variable Resolution with Scope Chain', () => {
  describe('R-SCOPE-21: Bare identifier resolves via scope chain first, then data', () => {
    // AC-SCOPE-01: Given context.data.user = "Emma" and empty scope,
    // when evaluating `user`, then result is "Emma"
    it('should resolve bare identifier from data when scope is empty', async () => {
      const context = fromPartialContext({
        data: { user: 'Emma' },
      })
      // Empty scope chain by default
      expect(context.scopeChain.current).toEqual({})

      const expr: IdentifierNode = { type: 'identifier', value: 'user' }
      expect(await evaluator.evaluate(expr, context)).toBe('Emma')
    })

    // AC-SCOPE-02: Given context.data.user = "Emma" and context.scope.user = "Carlos",
    // when evaluating `user`, then result is "Carlos" (scope wins)
    it('should resolve bare identifier from scope when both scope and data have value', async () => {
      const scopeChain = createEmptyScopeChain()
      write('user', 'Carlos', scopeChain)

      const context = fromPartialContext({
        data: { user: 'Emma' },
        scopeChain,
      })

      const expr: IdentifierNode = { type: 'identifier', value: 'user' }
      expect(await evaluator.evaluate(expr, context)).toBe('Carlos')
    })

    it('should resolve bare identifier from parent scope', async () => {
      const parent = createEmptyScopeChain()
      write('user', 'Emma', parent)

      const child = pushScope(parent)
      write('tweet', 'Hello!', child)

      const context = fromPartialContext({
        data: {},
        scopeChain: child,
      })

      const expr: IdentifierNode = { type: 'identifier', value: 'user' }
      expect(await evaluator.evaluate(expr, context)).toBe('Emma')
    })

    it('should fall back to data when not found in any scope', async () => {
      const scopeChain = createEmptyScopeChain()
      write('tweet', 'Hello!', scopeChain)

      const context = fromPartialContext({
        data: { user: 'Emma', followers: 1500 },
        scopeChain,
      })

      const expr: IdentifierNode = { type: 'identifier', value: 'followers' }
      expect(await evaluator.evaluate(expr, context)).toBe(1500)
    })
  })

  describe('R-SCOPE-22: Scope chain lookup walks from current to root', () => {
    it('should find value in grandparent scope', async () => {
      const grandparent = createEmptyScopeChain()
      write('globalUser', 'Admin', grandparent)

      const parent = pushScope(grandparent)
      write('user', 'Emma', parent)

      const child = pushScope(parent)
      write('tweet', 'Hello!', child)

      const context = fromPartialContext({
        data: {},
        scopeChain: child,
      })

      // From deepest scope, can find grandparent value
      const expr: IdentifierNode = { type: 'identifier', value: 'globalUser' }
      expect(await evaluator.evaluate(expr, context)).toBe('Admin')
    })

    it('should return first match when shadowing', async () => {
      const parent = createEmptyScopeChain()
      write('item', 'outer', parent)

      const child = pushScope(parent)
      write('item', 'inner', child) // Shadow

      const context = fromPartialContext({
        data: { item: 'data-level' },
        scopeChain: child,
      })

      const expr: IdentifierNode = { type: 'identifier', value: 'item' }
      expect(await evaluator.evaluate(expr, context)).toBe('inner')
    })
  })

  describe('R-SCOPE-23: Explicit scope.user resolves via scope chain only', () => {
    // AC-SCOPE-03: Given context.scope.user = "Carlos",
    // when evaluating scope.user, then result is "Carlos"
    it('should resolve scope.user from scope chain', async () => {
      const scopeChain = createEmptyScopeChain()
      write('user', 'Carlos', scopeChain)

      const context = fromPartialContext({
        data: { user: 'Emma' }, // Should NOT use this
        scopeChain,
      })

      // scope.user as MemberExpression: object=scope, path=[user]
      const expr: MemberExpressionNode = {
        type: 'member',
        object: { type: 'identifier', value: 'scope' },
        path: ['user'],
        computed: false,
      }
      expect(await evaluator.evaluate(expr, context)).toBe('Carlos')
    })

    it('should return undefined when scope.user not in scope chain', async () => {
      const context = fromPartialContext({
        data: { user: 'Emma' }, // Should NOT use this for scope.user
        scopeChain: createEmptyScopeChain(),
      })

      const expr: MemberExpressionNode = {
        type: 'member',
        object: { type: 'identifier', value: 'scope' },
        path: ['user'],
        computed: false,
      }
      expect(await evaluator.evaluate(expr, context)).toBeUndefined()
    })

    it('should walk parent chain for scope.user', async () => {
      const parent = createEmptyScopeChain()
      write('user', 'Emma', parent)

      const child = pushScope(parent)
      write('tweet', 'Hello!', child)

      const context = fromPartialContext({
        data: {},
        scopeChain: child,
      })

      const expr: MemberExpressionNode = {
        type: 'member',
        object: { type: 'identifier', value: 'scope' },
        path: ['user'],
        computed: false,
      }
      expect(await evaluator.evaluate(expr, context)).toBe('Emma')
    })
  })

  describe('R-SCOPE-24: Explicit data.user resolves to context.data.data.user', () => {
    // AC-SCOPE-04: Given context.data.data = { user: "Emma" },
    // when evaluating data.user, then result is "Emma" (no special meaning)
    it('should resolve data.user from context.data.data.user', async () => {
      const context = fromPartialContext({
        data: {
          data: { user: 'Emma' }, // Nested data object
          user: 'Carlos', // Top-level user (should NOT be accessed)
        },
      })

      // data.user resolves to context.data.data.user
      // Because 'data' is just an identifier, resolves to context.data.data
      const expr: MemberExpressionNode = {
        type: 'member',
        object: { type: 'identifier', value: 'data' },
        path: ['user'],
        computed: false,
      }
      expect(await evaluator.evaluate(expr, context)).toBe('Emma')
    })

    it('should return undefined when context.data.data.user does not exist', async () => {
      const context = fromPartialContext({
        data: {
          user: 'Carlos', // Top-level, not context.data.data.user
        },
      })

      const expr: MemberExpressionNode = {
        type: 'member',
        object: { type: 'identifier', value: 'data' },
        path: ['user'],
        computed: false,
      }
      expect(await evaluator.evaluate(expr, context)).toBeUndefined()
    })
  })

  describe('R-SCOPE-25: Member expression uses same resolution for root object', () => {
    // AC-SCOPE-11: Given context.scope.user = { name: "Carlos", followers: 5000 },
    // when evaluating user.followers, then result is 5000 (scope resolution for root)
    it('should resolve root object from scope for member expression', async () => {
      const scopeChain = createEmptyScopeChain()
      write('user', { name: 'Carlos', followers: 5000 }, scopeChain)

      const context = fromPartialContext({
        data: { user: { name: 'Emma', followers: 1500 } },
        scopeChain,
      })

      // user.followers: root 'user' resolves from scope first
      const expr: MemberExpressionNode = {
        type: 'member',
        object: { type: 'identifier', value: 'user' },
        path: ['followers'],
        computed: false,
      }
      expect(await evaluator.evaluate(expr, context)).toBe(5000)
    })

    it('should resolve root object from data when not in scope', async () => {
      const context = fromPartialContext({
        data: { user: { name: 'Emma', followers: 1500 } },
        scopeChain: createEmptyScopeChain(),
      })

      const expr: MemberExpressionNode = {
        type: 'member',
        object: { type: 'identifier', value: 'user' },
        path: ['followers'],
        computed: false,
      }
      expect(await evaluator.evaluate(expr, context)).toBe(1500)
    })

    it('should handle nested member paths with scope resolution', async () => {
      const scopeChain = createEmptyScopeChain()
      write(
        'user',
        {
          name: 'Carlos',
          profile: {
            settings: { theme: 'light' },
          },
        },
        scopeChain,
      )

      const context = fromPartialContext({
        data: {
          user: {
            name: 'Emma',
            profile: {
              settings: { theme: 'dark' },
            },
          },
        },
        scopeChain,
      })

      // user.profile.settings.theme: root 'user' from scope
      const expr: MemberExpressionNode = {
        type: 'member',
        object: { type: 'identifier', value: 'user' },
        path: ['profile', 'settings', 'theme'],
        computed: false,
      }
      expect(await evaluator.evaluate(expr, context)).toBe('light')
    })
  })
})

// ============================================================================
// EVALUATOR CHANGES FOR SCOPE (R-SCOPE-81 to R-SCOPE-83)
// ============================================================================

describe('ExpressionEvaluator - Scope-Aware Evaluation', () => {
  describe('R-SCOPE-81: evaluate() uses new resolution logic', () => {
    it('should use scope-first resolution in evaluate()', async () => {
      const scopeChain = createEmptyScopeChain()
      write('count', 999, scopeChain)

      const context = fromPartialContext({
        data: { count: 42 },
        scopeChain,
      })

      const expr: IdentifierNode = { type: 'identifier', value: 'count' }
      expect(await evaluator.evaluate(expr, context)).toBe(999)
    })
  })

  describe('R-SCOPE-82: IdentifierNode resolution walks scope chain then data', () => {
    it('should walk scope chain for identifier', async () => {
      const grandparent = createEmptyScopeChain()
      write('level0', 'grandparent', grandparent)

      const parent = pushScope(grandparent)
      write('level1', 'parent', parent)

      const child = pushScope(parent)
      write('level2', 'child', child)

      const context = fromPartialContext({
        data: { level0: 'data', level1: 'data', level2: 'data' },
        scopeChain: child,
      })

      // All resolve from scope chain, not data
      expect(
        await evaluator.evaluate(
          { type: 'identifier', value: 'level0' },
          context,
        ),
      ).toBe('grandparent')
      expect(
        await evaluator.evaluate(
          { type: 'identifier', value: 'level1' },
          context,
        ),
      ).toBe('parent')
      expect(
        await evaluator.evaluate(
          { type: 'identifier', value: 'level2' },
          context,
        ),
      ).toBe('child')
    })

    it('should fall through to data when not in scope', async () => {
      const scopeChain = createEmptyScopeChain()
      write('scopeOnly', 'from-scope', scopeChain)

      const context = fromPartialContext({
        data: { dataOnly: 'from-data' },
        scopeChain,
      })

      expect(
        await evaluator.evaluate(
          { type: 'identifier', value: 'scopeOnly' },
          context,
        ),
      ).toBe('from-scope')
      expect(
        await evaluator.evaluate(
          { type: 'identifier', value: 'dataOnly' },
          context,
        ),
      ).toBe('from-data')
    })
  })

  describe('R-SCOPE-83: MemberExpressionNode applies scope chain logic to root', () => {
    it('should apply scope resolution to root of member expression', async () => {
      const scopeChain = createEmptyScopeChain()
      write('config', { debug: true, maxRetries: 5 }, scopeChain)

      const context = fromPartialContext({
        data: { config: { debug: false, maxRetries: 3 } },
        scopeChain,
      })

      const expr: MemberExpressionNode = {
        type: 'member',
        object: { type: 'identifier', value: 'config' },
        path: ['debug'],
        computed: false,
      }
      expect(await evaluator.evaluate(expr, context)).toBe(true)
    })

    it('should handle scope.x member expression specially', async () => {
      const scopeChain = createEmptyScopeChain()
      write('x', 'scope-value', scopeChain)

      const context = fromPartialContext({
        data: { scope: { x: 'data-scope-x' } },
        scopeChain,
      })

      // scope.x should resolve from scope chain, not from context.data.scope.x
      const expr: MemberExpressionNode = {
        type: 'member',
        object: { type: 'identifier', value: 'scope' },
        path: ['x'],
        computed: false,
      }
      expect(await evaluator.evaluate(expr, context)).toBe('scope-value')
    })
  })
})

// ============================================================================
// ASYNC EVALUATOR (R-ASYNC-01 to R-ASYNC-04, R-STORE-21 to R-STORE-24)
// ============================================================================

describe('ExpressionEvaluator - Async Evaluation', () => {
  describe('R-ASYNC-01: evaluate() returns Promise<any> for all expression types', () => {
    // AC-ASYNC-01: Given expression `42`, when evaluated, then `await evaluate()` returns `42`
    it('should return Promise that resolves to literal number', async () => {
      const expr: LiteralNumberNode = { type: 'literal-number', value: 42 }
      const result = evaluator.evaluate(expr, socialMediaContext)
      expect(result).toBeInstanceOf(Promise)
      expect(await result).toBe(42)
    })

    it('should return Promise that resolves to literal string', async () => {
      const expr: LiteralStringNode = { type: 'literal-string', value: 'hello' }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe('hello')
    })

    it('should return Promise that resolves to literal boolean', async () => {
      const expr: LiteralBooleanNode = { type: 'literal-boolean', value: true }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })

    it('should return Promise that resolves to null', async () => {
      const expr: LiteralNullNode = { type: 'literal-null', value: null }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(null)
    })

    it('should return Promise that resolves to identifier value', async () => {
      const expr: IdentifierNode = { type: 'identifier', value: 'count' }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(42)
    })
  })

  describe('R-ASYNC-02: Literal evaluation resolves immediately', () => {
    it('should resolve literal immediately without async overhead', async () => {
      const expr: LiteralNumberNode = { type: 'literal-number', value: 42 }
      // The promise should resolve synchronously (no real async work)
      const promise = evaluator.evaluate(expr, socialMediaContext)
      expect(await promise).toBe(42)
    })
  })

  describe('R-ASYNC-03: All existing evaluator patterns work with async/await', () => {
    // AC-ASYNC-02: Given expression `user.name` with context `{ user: { name: "Emma" } }`,
    // when evaluated, then `await evaluate()` returns `"Emma"`
    it('should resolve member expression asynchronously', async () => {
      const expr: MemberExpressionNode = {
        type: 'member',
        object: { type: 'identifier', value: 'user' },
        path: ['name'],
        computed: false,
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe('Emma')
    })

    it('should resolve unary expression asynchronously', async () => {
      const expr: UnaryExpressionNode = {
        type: 'unary',
        operator: '!',
        argument: { type: 'literal-boolean', value: false },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })

    it('should resolve binary expression asynchronously', async () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '+',
        left: { type: 'literal-number', value: 5 },
        right: { type: 'literal-number', value: 3 },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(8)
    })

    it('should resolve logical expression asynchronously', async () => {
      const expr: LogicalExpressionNode = {
        type: 'logical',
        operator: '&&',
        left: { type: 'literal-boolean', value: true },
        right: { type: 'literal-boolean', value: true },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })

    it('should resolve array literal asynchronously', async () => {
      const expr: ArrayLiteralNode = {
        type: 'array-literal',
        elements: [
          { type: 'literal-number', value: 1 },
          { type: 'literal-number', value: 2 },
        ],
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toEqual([1, 2])
    })
  })

  describe('R-ASYNC-04: Nested expressions await inner results before computing outer', () => {
    it('should await nested binary operations', async () => {
      // (5 + 3) * 2 = 16
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '*',
        left: {
          type: 'binary',
          operator: '+',
          left: { type: 'literal-number', value: 5 },
          right: { type: 'literal-number', value: 3 },
        },
        right: { type: 'literal-number', value: 2 },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(16)
    })

    it('should await nested logical operations', async () => {
      // (true && false) || true = true
      const expr: LogicalExpressionNode = {
        type: 'logical',
        operator: '||',
        left: {
          type: 'logical',
          operator: '&&',
          left: { type: 'literal-boolean', value: true },
          right: { type: 'literal-boolean', value: false },
        },
        right: { type: 'literal-boolean', value: true },
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })

    it('should await array elements before returning array', async () => {
      const expr: ArrayLiteralNode = {
        type: 'array-literal',
        elements: [
          { type: 'identifier', value: 'count' },
          { type: 'identifier', value: 'price' },
        ],
      }
      expect(await evaluator.evaluate(expr, socialMediaContext)).toEqual([
        42, 10,
      ])
    })
  })
})

// ============================================================================
// STORE ACCESS (R-STORE-21 to R-STORE-24)
// ============================================================================

describe('ExpressionEvaluator - Store Access', () => {
  // Helper to create context with store provider
  const createContextWithStore = (storeData: Record<string, any>) => {
    const storeProvider = {
      get: async (path: string): Promise<any> => {
        // Simulate async store access
        return storeData[path]
      },
      set: undefined,
      toSerializable: () => ({
        uri: 'memory://test-store',
        name: 'test-store',
        option: undefined,
      }),
    }
    return fromPartialContext({
      data: { localVar: 'local-value' },
      storeProvider,
    })
  }

  describe('R-STORE-21: store.customers resolves via StoreProvider.get()', () => {
    // AC-ASYNC-03: Given store with `{ followers: 1500 }`, when evaluating `store.followers`, then result is `1500`
    it('should resolve store.followers to 1500', async () => {
      const context = createContextWithStore({ followers: 1500 })
      const expr: MemberExpressionNode = {
        type: 'member',
        object: { type: 'identifier', value: 'store' },
        path: ['followers'],
        computed: false,
      }
      expect(await evaluator.evaluate(expr, context)).toBe(1500)
    })

    it('should resolve store.customers to customer data', async () => {
      const context = createContextWithStore({
        customers: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
      })
      const expr: MemberExpressionNode = {
        type: 'member',
        object: { type: 'identifier', value: 'store' },
        path: ['customers'],
        computed: false,
      }
      const result = await evaluator.evaluate(expr, context)
      expect(result).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ])
    })
  })

  describe('R-STORE-22: store.nested.path resolves via StoreProvider.get()', () => {
    // AC-ASYNC-04: Given store with `{ user: { name: "Carlos" } }`, when evaluating `store.user.name`, then result is `"Carlos"`
    it('should resolve store.user.name to Carlos', async () => {
      const context = createContextWithStore({ 'user.name': 'Carlos' })
      const expr: MemberExpressionNode = {
        type: 'member',
        object: { type: 'identifier', value: 'store' },
        path: ['user', 'name'],
        computed: false,
      }
      expect(await evaluator.evaluate(expr, context)).toBe('Carlos')
    })

    it('should resolve deeply nested store paths', async () => {
      const context = createContextWithStore({ 'config.db.host': 'localhost' })
      const expr: MemberExpressionNode = {
        type: 'member',
        object: { type: 'identifier', value: 'store' },
        path: ['config', 'db', 'host'],
        computed: false,
      }
      expect(await evaluator.evaluate(expr, context)).toBe('localhost')
    })
  })

  describe('R-STORE-23: Missing store key returns undefined', () => {
    // AC-ASYNC-05: Given empty store, when evaluating `store.missing`, then result is `undefined`
    it('should return undefined for missing store key', async () => {
      const context = createContextWithStore({})
      const expr: MemberExpressionNode = {
        type: 'member',
        object: { type: 'identifier', value: 'store' },
        path: ['missing'],
        computed: false,
      }
      expect(await evaluator.evaluate(expr, context)).toBeUndefined()
    })

    it('should return undefined for missing nested store path', async () => {
      const context = createContextWithStore({})
      const expr: MemberExpressionNode = {
        type: 'member',
        object: { type: 'identifier', value: 'store' },
        path: ['missing', 'nested', 'path'],
        computed: false,
      }
      expect(await evaluator.evaluate(expr, context)).toBeUndefined()
    })
  })

  describe('R-STORE-24: Store access works in complex expressions', () => {
    // AC-ASYNC-06: Given store `{ count: 10 }` and context `{ limit: 5 }`, when evaluating `store.count > limit`, then result is `true`
    it('should evaluate store.count > limit to true', async () => {
      const storeProvider = {
        get: async (path: string): Promise<any> => {
          if (path === 'count') return 10
          return undefined
        },
        set: undefined,
        toSerializable: () => ({
          uri: 'memory://test-store',
          name: 'test-store',
          option: undefined,
        }),
      }
      const context = fromPartialContext({
        data: { limit: 5 },
        storeProvider,
      })
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '>',
        left: {
          type: 'member',
          object: { type: 'identifier', value: 'store' },
          path: ['count'],
          computed: false,
        },
        right: { type: 'identifier', value: 'limit' },
      }
      expect(await evaluator.evaluate(expr, context)).toBe(true)
    })

    // AC-ASYNC-07: Given store `{ price: 10 }` and context `{ qty: 3 }`, when evaluating `store.price * qty`, then result is `30`
    it('should evaluate store.price * qty to 30', async () => {
      const storeProvider = {
        get: async (path: string): Promise<any> => {
          if (path === 'price') return 10
          return undefined
        },
        set: undefined,
        toSerializable: () => ({
          uri: 'memory://test-store',
          name: 'test-store',
          option: undefined,
        }),
      }
      const context = fromPartialContext({
        data: { qty: 3 },
        storeProvider,
      })
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '*',
        left: {
          type: 'member',
          object: { type: 'identifier', value: 'store' },
          path: ['price'],
          computed: false,
        },
        right: { type: 'identifier', value: 'qty' },
      }
      expect(await evaluator.evaluate(expr, context)).toBe(30)
    })

    it('should evaluate store value in logical expression', async () => {
      const storeProvider = {
        get: async (path: string): Promise<any> => {
          if (path === 'isEnabled') return true
          return undefined
        },
        set: undefined,
        toSerializable: () => ({
          uri: 'memory://test-store',
          name: 'test-store',
          option: undefined,
        }),
      }
      const context = fromPartialContext({
        data: { hasPermission: true },
        storeProvider,
      })
      const expr: LogicalExpressionNode = {
        type: 'logical',
        operator: '&&',
        left: {
          type: 'member',
          object: { type: 'identifier', value: 'store' },
          path: ['isEnabled'],
          computed: false,
        },
        right: { type: 'identifier', value: 'hasPermission' },
      }
      expect(await evaluator.evaluate(expr, context)).toBe(true)
    })
  })

  describe('Store access without storeProvider', () => {
    it('should return undefined when no storeProvider is set', async () => {
      const context = fromPartialContext({
        data: { localVar: 'value' },
      })
      const expr: MemberExpressionNode = {
        type: 'member',
        object: { type: 'identifier', value: 'store' },
        path: ['anything'],
        computed: false,
      }
      expect(await evaluator.evaluate(expr, context)).toBeUndefined()
    })
  })
})

// ============================================================================
// PIPE EXPRESSION EVALUATION (R-PIPE-01 to R-PIPE-83)
// ============================================================================

import { PipeExpressionNode } from '../parser/args-details/pipe-parser/pipe-parser.js'
import { PipeRegistry, CorePipesBundle } from '../pipe-registry/index.js'

describe('ExpressionEvaluator - Pipe Expressions', () => {
  // Create evaluator with pipe registry
  let pipeEvaluator: ExpressionEvaluator
  let pipeRegistry: PipeRegistry

  beforeAll(async () => {
    pipeRegistry = new PipeRegistry()
    pipeRegistry.addBundle(new CorePipesBundle())
    await pipeRegistry.reload()
    pipeEvaluator = new ExpressionEvaluator(pipeRegistry)
  })

  // Theme: Social Media Automation - users array for testing
  // Note: Property names like 'name', 'active' are added to context so identifier
  // arguments in pipes resolve correctly per R-PIPE-43 (identifiers resolve from context)
  const usersContext = fromPartialContext({
    data: {
      users: [
        { name: 'Emma', active: true, followers: 1500 },
        { name: 'Bob', active: false, followers: 500 },
        { name: 'Carlos', active: true, followers: 3000 },
      ],
      items: [1, 2, 3, 4, 5],
      names: ['Alice', 'Bob'],
      parts: ['a', 'b', 'c'],
      duplicates: [1, 2, 2, 3, 1],
      nested: [[1, 2], [3, 4], [5]] as any,
      count: 5,
      field: 'active',
      expected: true,
      // Property name strings for pipe argument resolution
      name: 'name',
      active: 'active',
      nonexistent: 'nonexistent',
      followers: 'followers',
      x: 'x',
    },
  })

  // ============================================================================
  // CORE PIPES: filter, map, first, last, join, length (R-PIPE-01 to R-PIPE-06)
  // ============================================================================

  describe('R-PIPE-01: filter:propName:value', () => {
    // AC-PIPE-01: Given users array, when evaluating {users | filter:active:true},
    // then result is array of active users
    it('should filter array by property value', async () => {
      const expr: PipeExpressionNode = {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'users' },
        segments: [
          {
            pipeName: 'filter',
            args: [
              { type: 'identifier', value: 'active' },
              { type: 'literal-boolean', value: true },
            ],
          },
        ],
      }
      const result = await pipeEvaluator.evaluate(expr, usersContext)
      expect(result).toEqual([
        { name: 'Emma', active: true, followers: 1500 },
        { name: 'Carlos', active: true, followers: 3000 },
      ])
    })

    it('should filter by string property value', async () => {
      const expr: PipeExpressionNode = {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'users' },
        segments: [
          {
            pipeName: 'filter',
            args: [
              { type: 'identifier', value: 'name' },
              { type: 'literal-string', value: 'Emma' },
            ],
          },
        ],
      }
      const result = await pipeEvaluator.evaluate(expr, usersContext)
      expect(result).toEqual([{ name: 'Emma', active: true, followers: 1500 }])
    })
  })

  describe('R-PIPE-02: map:propName', () => {
    // AC-PIPE-02: Given users array, when evaluating {users | map:name},
    // then result is ["Emma", "Bob", "Carlos"]
    it('should extract property from each item', async () => {
      const expr: PipeExpressionNode = {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'users' },
        segments: [
          {
            pipeName: 'map',
            args: [{ type: 'identifier', value: 'name' }],
          },
        ],
      }
      const result = await pipeEvaluator.evaluate(expr, usersContext)
      expect(result).toEqual(['Emma', 'Bob', 'Carlos'])
    })

    it('should return undefined for missing properties', async () => {
      const expr: PipeExpressionNode = {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'users' },
        segments: [
          {
            pipeName: 'map',
            args: [{ type: 'identifier', value: 'nonexistent' }],
          },
        ],
      }
      const result = await pipeEvaluator.evaluate(expr, usersContext)
      expect(result).toEqual([undefined, undefined, undefined])
    })
  })

  describe('R-PIPE-03: first', () => {
    // AC-PIPE-04: Given items = [1, 2, 3], when evaluating {items | first}, then result is 1
    it('should return first element of array', async () => {
      const expr: PipeExpressionNode = {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'items' },
        segments: [{ pipeName: 'first', args: [] }],
      }
      const result = await pipeEvaluator.evaluate(expr, usersContext)
      expect(result).toBe(1)
    })

    // AC-PIPE-06: Given items = [], when evaluating {items | first}, then result is undefined
    it('should return undefined for empty array', async () => {
      const context = fromPartialContext({ data: { items: [] } })
      const expr: PipeExpressionNode = {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'items' },
        segments: [{ pipeName: 'first', args: [] }],
      }
      const result = await pipeEvaluator.evaluate(expr, context)
      expect(result).toBeUndefined()
    })
  })

  describe('R-PIPE-04: last', () => {
    // AC-PIPE-05: Given items = [1, 2, 3], when evaluating {items | last}, then result is 3
    it('should return last element of array', async () => {
      const expr: PipeExpressionNode = {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'items' },
        segments: [{ pipeName: 'last', args: [] }],
      }
      const result = await pipeEvaluator.evaluate(expr, usersContext)
      expect(result).toBe(5)
    })

    it('should return undefined for empty array', async () => {
      const context = fromPartialContext({ data: { items: [] } })
      const expr: PipeExpressionNode = {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'items' },
        segments: [{ pipeName: 'last', args: [] }],
      }
      const result = await pipeEvaluator.evaluate(expr, context)
      expect(result).toBeUndefined()
    })
  })

  describe('R-PIPE-05: join:separator', () => {
    // AC-PIPE-07: Given names = ["Alice", "Bob"], when evaluating {names | join:", "},
    // then result is "Alice, Bob"
    it('should join array with custom separator', async () => {
      const expr: PipeExpressionNode = {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'names' },
        segments: [
          {
            pipeName: 'join',
            args: [{ type: 'literal-string', value: ', ' }],
          },
        ],
      }
      const result = await pipeEvaluator.evaluate(expr, usersContext)
      expect(result).toBe('Alice, Bob')
    })

    // AC-PIPE-13: Given names, when evaluating {names | join}, then result is "Alice,Bob"
    it('should use default comma separator when no argument', async () => {
      const expr: PipeExpressionNode = {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'names' },
        segments: [{ pipeName: 'join', args: [] }],
      }
      const result = await pipeEvaluator.evaluate(expr, usersContext)
      expect(result).toBe('Alice,Bob')
    })

    // AC-PIPE-14: Given parts = ["a", "b", "c"], when evaluating {parts | join:":"},
    // then result is "a:b:c"
    it('should join with colon separator', async () => {
      const expr: PipeExpressionNode = {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'parts' },
        segments: [
          {
            pipeName: 'join',
            args: [{ type: 'literal-string', value: ':' }],
          },
        ],
      }
      const result = await pipeEvaluator.evaluate(expr, usersContext)
      expect(result).toBe('a:b:c')
    })
  })

  describe('R-PIPE-06: length', () => {
    // AC-PIPE-08: Given names = ["Alice", "Bob"], when evaluating {names | length},
    // then result is 2
    it('should return length of array', async () => {
      const expr: PipeExpressionNode = {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'names' },
        segments: [{ pipeName: 'length', args: [] }],
      }
      const result = await pipeEvaluator.evaluate(expr, usersContext)
      expect(result).toBe(2)
    })

    it('should return length of string', async () => {
      const context = fromPartialContext({ data: { message: 'hello' } })
      const expr: PipeExpressionNode = {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'message' },
        segments: [{ pipeName: 'length', args: [] }],
      }
      const result = await pipeEvaluator.evaluate(expr, context)
      expect(result).toBe(5)
    })
  })

  // ============================================================================
  // ADDITIONAL PIPES: flatten, reverse, slice, unique (R-PIPE-21 to R-PIPE-24)
  // ============================================================================

  describe('R-PIPE-21: flatten', () => {
    it('should flatten one level of nested arrays', async () => {
      const expr: PipeExpressionNode = {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'nested' },
        segments: [{ pipeName: 'flatten', args: [] }],
      }
      const result = await pipeEvaluator.evaluate(expr, usersContext)
      expect(result).toEqual([1, 2, 3, 4, 5])
    })
  })

  describe('R-PIPE-22: reverse', () => {
    it('should return reversed array without mutating original', async () => {
      const expr: PipeExpressionNode = {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'items' },
        segments: [{ pipeName: 'reverse', args: [] }],
      }
      const result = await pipeEvaluator.evaluate(expr, usersContext)
      expect(result).toEqual([5, 4, 3, 2, 1])
      // Original should not be mutated
      expect(usersContext.data.items).toEqual([1, 2, 3, 4, 5])
    })
  })

  describe('R-PIPE-23: slice:start:end', () => {
    // AC-PIPE-15: Given items = [1, 2, 3, 4, 5], when evaluating {items | slice:1:3},
    // then result is [2, 3]
    it('should return slice with start and end', async () => {
      const expr: PipeExpressionNode = {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'items' },
        segments: [
          {
            pipeName: 'slice',
            args: [
              { type: 'literal-number', value: 1 },
              { type: 'literal-number', value: 3 },
            ],
          },
        ],
      }
      const result = await pipeEvaluator.evaluate(expr, usersContext)
      expect(result).toEqual([2, 3])
    })

    // AC-PIPE-16: Given items = [1, 2, 3, 4, 5], when evaluating {items | slice:2},
    // then result is [3, 4, 5]
    it('should slice from start to end when no end argument', async () => {
      const expr: PipeExpressionNode = {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'items' },
        segments: [
          {
            pipeName: 'slice',
            args: [{ type: 'literal-number', value: 2 }],
          },
        ],
      }
      const result = await pipeEvaluator.evaluate(expr, usersContext)
      expect(result).toEqual([3, 4, 5])
    })
  })

  describe('R-PIPE-24: unique', () => {
    // AC-PIPE-17: Given items = [1, 2, 2, 3, 1], when evaluating {items | unique},
    // then result is [1, 2, 3]
    it('should return array with duplicates removed', async () => {
      const expr: PipeExpressionNode = {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'duplicates' },
        segments: [{ pipeName: 'unique', args: [] }],
      }
      const result = await pipeEvaluator.evaluate(expr, usersContext)
      expect(result).toEqual([1, 2, 3])
    })
  })

  // ============================================================================
  // PIPE ARGUMENTS: R-PIPE-41 to R-PIPE-44
  // ============================================================================

  describe('R-PIPE-41 to R-PIPE-44: Pipe Arguments', () => {
    // R-PIPE-41: Pipe arguments are evaluated as expressions
    it('should evaluate identifier arguments from context', async () => {
      // Uses field="active" and expected=true from context
      const expr: PipeExpressionNode = {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'users' },
        segments: [
          {
            pipeName: 'filter',
            args: [
              { type: 'identifier', value: 'field' },
              { type: 'identifier', value: 'expected' },
            ],
          },
        ],
      }
      const result = await pipeEvaluator.evaluate(expr, usersContext)
      expect(result).toEqual([
        { name: 'Emma', active: true, followers: 1500 },
        { name: 'Carlos', active: true, followers: 3000 },
      ])
    })

    // R-PIPE-44: Multiple arguments supported
    it('should pass multiple arguments to slice pipe', async () => {
      const expr: PipeExpressionNode = {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'items' },
        segments: [
          {
            pipeName: 'slice',
            args: [
              { type: 'literal-number', value: 0 },
              { type: 'literal-number', value: 3 },
            ],
          },
        ],
      }
      const result = await pipeEvaluator.evaluate(expr, usersContext)
      expect(result).toEqual([1, 2, 3])
    })
  })

  // ============================================================================
  // CHAINING: R-PIPE-61 to R-PIPE-63
  // ============================================================================

  describe('R-PIPE-61 to R-PIPE-63: Pipe Chaining', () => {
    // AC-PIPE-03: Given users, when evaluating {users | filter:active:true | map:name},
    // then result is ["Emma", "Carlos"]
    it('should chain filter and map pipes', async () => {
      const expr: PipeExpressionNode = {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'users' },
        segments: [
          {
            pipeName: 'filter',
            args: [
              { type: 'identifier', value: 'active' },
              { type: 'literal-boolean', value: true },
            ],
          },
          {
            pipeName: 'map',
            args: [{ type: 'identifier', value: 'name' }],
          },
        ],
      }
      const result = await pipeEvaluator.evaluate(expr, usersContext)
      expect(result).toEqual(['Emma', 'Carlos'])
    })

    // AC-PIPE-09: Given users, when evaluating {users | filter:active:true | map:name | first},
    // then result is "Emma"
    it('should chain three pipes', async () => {
      const expr: PipeExpressionNode = {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'users' },
        segments: [
          {
            pipeName: 'filter',
            args: [
              { type: 'identifier', value: 'active' },
              { type: 'literal-boolean', value: true },
            ],
          },
          {
            pipeName: 'map',
            args: [{ type: 'identifier', value: 'name' }],
          },
          { pipeName: 'first', args: [] },
        ],
      }
      const result = await pipeEvaluator.evaluate(expr, usersContext)
      expect(result).toBe('Emma')
    })

    it('should chain map and join', async () => {
      const expr: PipeExpressionNode = {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'users' },
        segments: [
          {
            pipeName: 'map',
            args: [{ type: 'identifier', value: 'name' }],
          },
          {
            pipeName: 'join',
            args: [{ type: 'literal-string', value: ', ' }],
          },
        ],
      }
      const result = await pipeEvaluator.evaluate(expr, usersContext)
      expect(result).toBe('Emma, Bob, Carlos')
    })

    it('should chain slice and length', async () => {
      const expr: PipeExpressionNode = {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'items' },
        segments: [
          {
            pipeName: 'slice',
            args: [
              { type: 'literal-number', value: 0 },
              { type: 'literal-number', value: 3 },
            ],
          },
          { pipeName: 'length', args: [] },
        ],
      }
      const result = await pipeEvaluator.evaluate(expr, usersContext)
      expect(result).toBe(3)
    })
  })

  // ============================================================================
  // ERROR HANDLING: R-PIPE-81 to R-PIPE-83
  // ============================================================================

  describe('R-PIPE-81 to R-PIPE-83: Error Handling', () => {
    // AC-PIPE-11: Given users, when evaluating {users | unknownPipe},
    // then throws EvaluationError mentioning "Unknown pipe: unknownPipe"
    it('should throw error for unknown pipe', async () => {
      const expr: PipeExpressionNode = {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'users' },
        segments: [{ pipeName: 'unknownPipe', args: [] }],
      }
      await expect(pipeEvaluator.evaluate(expr, usersContext)).rejects.toThrow(
        /unknown.*pipe.*unknownPipe/i,
      )
    })

    // AC-PIPE-10: Given count = 5, when evaluating {count | filter:x:true},
    // then throws error mentioning "filter requires array"
    it('should throw error for type mismatch (filter on non-array)', async () => {
      const expr: PipeExpressionNode = {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'count' },
        segments: [
          {
            pipeName: 'filter',
            args: [
              { type: 'identifier', value: 'x' },
              { type: 'literal-boolean', value: true },
            ],
          },
        ],
      }
      await expect(pipeEvaluator.evaluate(expr, usersContext)).rejects.toThrow(
        /filter.*array/i,
      )
    })

    it('should throw error for map on non-array', async () => {
      const expr: PipeExpressionNode = {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'count' },
        segments: [
          {
            pipeName: 'map',
            args: [{ type: 'identifier', value: 'x' }],
          },
        ],
      }
      await expect(pipeEvaluator.evaluate(expr, usersContext)).rejects.toThrow(
        /map.*array/i,
      )
    })
  })

  // ============================================================================
  // BACKWARD COMPATIBILITY: AC-PIPE-12
  // ============================================================================

  describe('AC-PIPE-12: Backward Compatibility', () => {
    it('should still work with evaluator without pipe registry', async () => {
      // Old evaluator without pipe registry should throw informative error
      const oldEvaluator = new ExpressionEvaluator()
      const expr: PipeExpressionNode = {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'items' },
        segments: [{ pipeName: 'first', args: [] }],
      }
      await expect(oldEvaluator.evaluate(expr, usersContext)).rejects.toThrow(
        /pipe/i,
      )
    })
  })
})
