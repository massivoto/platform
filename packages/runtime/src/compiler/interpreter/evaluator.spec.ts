import { describe, it, expect } from 'vitest'
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
import {
  createEmptyScopeChain,
  pushScope,
  write,
} from './scope-chain.js'

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
    it('should evaluate literal-null node to null', () => {
      const expr: LiteralNullNode = { type: 'literal-null', value: null }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(null)
    })
  })

  describe('R-EVAL-02: existing literals still work', () => {
    it('should evaluate literal-string', () => {
      const expr: LiteralStringNode = { type: 'literal-string', value: 'hello' }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe('hello')
    })

    it('should evaluate literal-number', () => {
      const expr: LiteralNumberNode = { type: 'literal-number', value: 42 }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(42)
    })

    it('should evaluate literal-boolean true', () => {
      const expr: LiteralBooleanNode = { type: 'literal-boolean', value: true }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })

    it('should evaluate literal-boolean false', () => {
      const expr: LiteralBooleanNode = { type: 'literal-boolean', value: false }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(false)
    })

    it('should evaluate identifier', () => {
      const expr: IdentifierNode = { type: 'identifier', value: 'count' }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(42)
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
    it('should evaluate user.name to "Emma"', () => {
      const expr: MemberExpressionNode = {
        type: 'member',
        object: { type: 'identifier', value: 'user' },
        path: ['name'],
        computed: false,
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe('Emma')
    })

    it('should evaluate user.followers to 1500', () => {
      const expr: MemberExpressionNode = {
        type: 'member',
        object: { type: 'identifier', value: 'user' },
        path: ['followers'],
        computed: false,
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(1500)
    })

    it('should evaluate user.isVerified to true', () => {
      const expr: MemberExpressionNode = {
        type: 'member',
        object: { type: 'identifier', value: 'user' },
        path: ['isVerified'],
        computed: false,
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })
  })

  describe('R-EVAL-22: nested member path', () => {
    it('should evaluate user.profile.bio', () => {
      const expr: MemberExpressionNode = {
        type: 'member',
        object: { type: 'identifier', value: 'user' },
        path: ['profile', 'bio'],
        computed: false,
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(
        'Tech enthusiast',
      )
    })

    it('should evaluate user.profile.settings.theme to "dark"', () => {
      const expr: MemberExpressionNode = {
        type: 'member',
        object: { type: 'identifier', value: 'user' },
        path: ['profile', 'settings', 'theme'],
        computed: false,
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe('dark')
    })
  })

  describe('R-EVAL-23: missing properties return undefined', () => {
    // AC-EVAL-02: Given context { user: {} }, when evaluating user.profile.name,
    // then result is undefined (no error)
    it('should return undefined for missing property (no error)', () => {
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
      expect(evaluator.evaluate(expr, contextWithEmptyUser)).toBe(undefined)
    })

    it('should return undefined for deeply missing property', () => {
      const expr: MemberExpressionNode = {
        type: 'member',
        object: { type: 'identifier', value: 'user' },
        path: ['nonexistent', 'deep', 'path'],
        computed: false,
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(undefined)
    })
  })
})

// ============================================================================
// UNARY OPERATORS (R-EVAL-41 to R-EVAL-44)
// ============================================================================

describe('ExpressionEvaluator - Unary Operators', () => {
  describe('R-EVAL-41: logical NOT (!)', () => {
    // AC-EVAL-03: Given context { isVerified: false }, when evaluating !isVerified, then result is true
    it('should evaluate !false to true', () => {
      const contextWithFalseVerified = fromPartialContext({
        data: { isVerified: false },
        user: { id: 'test', extra: {} },
      })
      const expr: UnaryExpressionNode = {
        type: 'unary',
        operator: '!',
        argument: { type: 'identifier', value: 'isVerified' },
      }
      expect(evaluator.evaluate(expr, contextWithFalseVerified)).toBe(true)
    })

    // AC-EVAL-04: Given context { isVerified: true }, when evaluating !isVerified, then result is false
    it('should evaluate !true to false', () => {
      const expr: UnaryExpressionNode = {
        type: 'unary',
        operator: '!',
        argument: { type: 'identifier', value: 'isActive' },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(false)
    })

    // AC-EVAL-05: Given context { count: 0 }, when evaluating !count, then result is true (0 is falsy)
    it('should evaluate !0 to true (0 is falsy)', () => {
      const contextWithZero = fromPartialContext({
        data: { count: 0 },
        user: { id: 'test', extra: {} },
      })
      const expr: UnaryExpressionNode = {
        type: 'unary',
        operator: '!',
        argument: { type: 'identifier', value: 'count' },
      }
      expect(evaluator.evaluate(expr, contextWithZero)).toBe(true)
    })

    // AC-EVAL-06: Given context { count: 42 }, when evaluating !count, then result is false
    it('should evaluate !42 to false (non-zero is truthy)', () => {
      const expr: UnaryExpressionNode = {
        type: 'unary',
        operator: '!',
        argument: { type: 'identifier', value: 'count' },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(false)
    })

    // AC-EVAL-07: Given context { message: "" }, when evaluating !message, then result is true
    it('should evaluate !"" to true (empty string is falsy)', () => {
      const expr: UnaryExpressionNode = {
        type: 'unary',
        operator: '!',
        argument: { type: 'identifier', value: 'emptyMessage' },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })

    // AC-EVAL-08: Given context { message: "hello" }, when evaluating !message, then result is false
    it('should evaluate !"hello" to false (non-empty string is truthy)', () => {
      const expr: UnaryExpressionNode = {
        type: 'unary',
        operator: '!',
        argument: { type: 'identifier', value: 'message' },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(false)
    })

    // AC-EVAL-09: Given context { value: null }, when evaluating !value, then result is true
    it('should evaluate !null to true (null is falsy)', () => {
      const expr: UnaryExpressionNode = {
        type: 'unary',
        operator: '!',
        argument: { type: 'identifier', value: 'value' },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })

    // AC-EVAL-10: Given context { items: [] }, when evaluating !items, then result is false
    it('should evaluate ![] to false (arrays are truthy)', () => {
      const expr: UnaryExpressionNode = {
        type: 'unary',
        operator: '!',
        argument: { type: 'identifier', value: 'items' },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(false)
    })
  })

  describe('R-EVAL-42: numeric negation (-)', () => {
    it('should evaluate -42 to -42', () => {
      const expr: UnaryExpressionNode = {
        type: 'unary',
        operator: '-',
        argument: { type: 'literal-number', value: 42 },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(-42)
    })

    it('should evaluate -count (42) to -42', () => {
      const expr: UnaryExpressionNode = {
        type: 'unary',
        operator: '-',
        argument: { type: 'identifier', value: 'count' },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(-42)
    })
  })

  describe('R-EVAL-43: numeric coercion (+)', () => {
    it('should evaluate +42 to 42', () => {
      const expr: UnaryExpressionNode = {
        type: 'unary',
        operator: '+',
        argument: { type: 'literal-number', value: 42 },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(42)
    })

    it('should evaluate +"5" to 5 (string coercion)', () => {
      const contextWithStringNum = fromPartialContext({
        data: { strNum: '5' },
        user: { id: 'test', extra: {} },
      })
      const expr: UnaryExpressionNode = {
        type: 'unary',
        operator: '+',
        argument: { type: 'identifier', value: 'strNum' },
      }
      expect(evaluator.evaluate(expr, contextWithStringNum)).toBe(5)
    })
  })

  describe('R-EVAL-44: nested unary', () => {
    it('should evaluate !!true to true', () => {
      const expr: UnaryExpressionNode = {
        type: 'unary',
        operator: '!',
        argument: {
          type: 'unary',
          operator: '!',
          argument: { type: 'literal-boolean', value: true },
        },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })

    it('should evaluate !!false to false', () => {
      const expr: UnaryExpressionNode = {
        type: 'unary',
        operator: '!',
        argument: {
          type: 'unary',
          operator: '!',
          argument: { type: 'literal-boolean', value: false },
        },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(false)
    })

    it('should evaluate --5 to 5', () => {
      const expr: UnaryExpressionNode = {
        type: 'unary',
        operator: '-',
        argument: {
          type: 'unary',
          operator: '-',
          argument: { type: 'literal-number', value: 5 },
        },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(5)
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
    it('should evaluate user.followers > 1000 to true', () => {
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
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })

    it('should evaluate 5 == 5 to true (strict equality)', () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '==',
        left: { type: 'literal-number', value: 5 },
        right: { type: 'literal-number', value: 5 },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })

    it('should evaluate 5 == "5" to false (strict equality, no coercion)', () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '==',
        left: { type: 'literal-number', value: 5 },
        right: { type: 'literal-string', value: '5' },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(false)
    })

    it('should evaluate null == null to true', () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '==',
        left: { type: 'literal-null', value: null },
        right: { type: 'literal-null', value: null },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })

    it('should evaluate null == undefined to false (strict)', () => {
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
      expect(evaluator.evaluate(expr, contextWithUndef)).toBe(false)
    })

    it('should evaluate 5 != 3 to true', () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '!=',
        left: { type: 'literal-number', value: 5 },
        right: { type: 'literal-number', value: 3 },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })

    it('should evaluate 5 < 10 to true', () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '<',
        left: { type: 'literal-number', value: 5 },
        right: { type: 'literal-number', value: 10 },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })

    it('should evaluate 5 <= 5 to true', () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '<=',
        left: { type: 'literal-number', value: 5 },
        right: { type: 'literal-number', value: 5 },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })

    it('should evaluate 10 > 5 to true', () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '>',
        left: { type: 'literal-number', value: 10 },
        right: { type: 'literal-number', value: 5 },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })

    it('should evaluate 5 >= 5 to true', () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '>=',
        left: { type: 'literal-number', value: 5 },
        right: { type: 'literal-number', value: 5 },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })
  })

  describe('R-EVAL-62: arithmetic operators', () => {
    // AC-EVAL-12: Given context { price: 10, quantity: 5 },
    // when evaluating price * quantity, then result is 50
    it('should evaluate price * quantity to 50', () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '*',
        left: { type: 'identifier', value: 'price' },
        right: { type: 'identifier', value: 'quantity' },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(50)
    })

    it('should evaluate 5 + 3 to 8', () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '+',
        left: { type: 'literal-number', value: 5 },
        right: { type: 'literal-number', value: 3 },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(8)
    })

    it('should evaluate "hello" + " world" to "hello world" (string concatenation)', () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '+',
        left: { type: 'literal-string', value: 'hello' },
        right: { type: 'literal-string', value: ' world' },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe('hello world')
    })

    it('should evaluate 10 - 3 to 7', () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '-',
        left: { type: 'literal-number', value: 10 },
        right: { type: 'literal-number', value: 3 },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(7)
    })

    it('should evaluate 10 / 2 to 5', () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '/',
        left: { type: 'literal-number', value: 10 },
        right: { type: 'literal-number', value: 2 },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(5)
    })

    it('should evaluate 10 / 0 to Infinity (JS semantics)', () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '/',
        left: { type: 'literal-number', value: 10 },
        right: { type: 'literal-number', value: 0 },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(Infinity)
    })

    it('should evaluate -10 / 0 to -Infinity (JS semantics)', () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '/',
        left: { type: 'literal-number', value: -10 },
        right: { type: 'literal-number', value: 0 },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(-Infinity)
    })

    it('should evaluate 10 % 3 to 1', () => {
      const expr: BinaryExpressionNode = {
        type: 'binary',
        operator: '%',
        left: { type: 'literal-number', value: 10 },
        right: { type: 'literal-number', value: 3 },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(1)
    })
  })

  describe('R-EVAL-63: nested binary (AST structure)', () => {
    it('should evaluate (a + b) * c respecting AST structure', () => {
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
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(16)
    })
  })

  describe('R-EVAL-64: mixed binary inside logical', () => {
    it('should evaluate count > 0 && count < 100', () => {
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
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(true)
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
    it('should evaluate true && true to true', () => {
      const expr: LogicalExpressionNode = {
        type: 'logical',
        operator: '&&',
        left: { type: 'identifier', value: 'hasAccess' },
        right: { type: 'identifier', value: 'isActive' },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })

    it('should evaluate false && anything to false (short-circuit)', () => {
      const expr: LogicalExpressionNode = {
        type: 'logical',
        operator: '&&',
        left: { type: 'literal-boolean', value: false },
        right: { type: 'literal-boolean', value: true },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(false)
    })

    it('should return first falsy value (short-circuit behavior)', () => {
      const expr: LogicalExpressionNode = {
        type: 'logical',
        operator: '&&',
        left: { type: 'literal-number', value: 0 },
        right: { type: 'literal-string', value: 'never reached' },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(0)
    })

    it('should return last value if all truthy', () => {
      const expr: LogicalExpressionNode = {
        type: 'logical',
        operator: '&&',
        left: { type: 'literal-number', value: 5 },
        right: { type: 'literal-string', value: 'result' },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe('result')
    })
  })

  describe('R-EVAL-82: || operator with short-circuit', () => {
    // AC-EVAL-14: Given context { hasAccess: false, isActive: true },
    // when evaluating hasAccess || isActive, then result is true
    it('should evaluate false || true to true', () => {
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
      expect(evaluator.evaluate(expr, contextWithFalseAccess)).toBe(true)
    })

    it('should evaluate true || anything to true (short-circuit)', () => {
      const expr: LogicalExpressionNode = {
        type: 'logical',
        operator: '||',
        left: { type: 'literal-boolean', value: true },
        right: { type: 'literal-boolean', value: false },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })

    it('should return first truthy value (short-circuit behavior)', () => {
      const expr: LogicalExpressionNode = {
        type: 'logical',
        operator: '||',
        left: { type: 'literal-string', value: 'first' },
        right: { type: 'literal-string', value: 'second' },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe('first')
    })

    it('should return last value if all falsy', () => {
      const expr: LogicalExpressionNode = {
        type: 'logical',
        operator: '||',
        left: { type: 'literal-boolean', value: false },
        right: { type: 'literal-number', value: 0 },
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(0)
    })
  })

  describe('R-EVAL-83: nested logical respects AST precedence', () => {
    it('should evaluate a && b || c respecting AST', () => {
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
      expect(evaluator.evaluate(expr, socialMediaContext)).toBe(true)
    })
  })
})

// ============================================================================
// ARRAY LITERALS (R-EVAL-101, R-EVAL-102)
// ============================================================================

describe('ExpressionEvaluator - Array Literals', () => {
  describe('R-EVAL-101: array-literal evaluation', () => {
    // AC-EVAL-15: Given expression [1, 2, 3], when evaluated, then result is array [1, 2, 3]
    it('should evaluate [1, 2, 3] to array [1, 2, 3]', () => {
      const expr: ArrayLiteralNode = {
        type: 'array-literal',
        elements: [
          { type: 'literal-number', value: 1 },
          { type: 'literal-number', value: 2 },
          { type: 'literal-number', value: 3 },
        ],
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toEqual([1, 2, 3])
    })

    it('should evaluate empty array []', () => {
      const expr: ArrayLiteralNode = {
        type: 'array-literal',
        elements: [],
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toEqual([])
    })

    it('should evaluate mixed type array', () => {
      const expr: ArrayLiteralNode = {
        type: 'array-literal',
        elements: [
          { type: 'literal-number', value: 1 },
          { type: 'literal-string', value: 'two' },
          { type: 'literal-boolean', value: true },
          { type: 'literal-null', value: null },
        ],
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toEqual([
        1,
        'two',
        true,
        null,
      ])
    })

    it('should evaluate array with identifiers', () => {
      const expr: ArrayLiteralNode = {
        type: 'array-literal',
        elements: [
          { type: 'identifier', value: 'count' },
          { type: 'identifier', value: 'price' },
        ],
      }
      expect(evaluator.evaluate(expr, socialMediaContext)).toEqual([42, 10])
    })
  })

  describe('R-EVAL-102: nested arrays', () => {
    it('should evaluate [[1, 2], [3, 4]]', () => {
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
      expect(evaluator.evaluate(expr, socialMediaContext)).toEqual([
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
    it('should throw EvaluationError for unknown node type', () => {
      const unknownExpr = {
        type: 'unknown-type',
        value: 'test',
      } as unknown as ExpressionNode
      expect(() => evaluator.evaluate(unknownExpr, socialMediaContext)).toThrow(
        EvaluationError,
      )
    })

    it('should include node type in error message', () => {
      const unknownExpr = {
        type: 'some-weird-type',
        value: 'test',
      } as unknown as ExpressionNode
      expect(() => evaluator.evaluate(unknownExpr, socialMediaContext)).toThrow(
        /some-weird-type/,
      )
    })
  })

  describe('R-EVAL-122: LLM-readable error messages', () => {
    it('should provide meaningful error context', () => {
      const unknownExpr = {
        type: 'mystery-node',
        data: { foo: 'bar' },
      } as unknown as ExpressionNode
      try {
        evaluator.evaluate(unknownExpr, socialMediaContext)
        expect.fail('Should have thrown')
      } catch (e) {
        expect(e).toBeInstanceOf(EvaluationError)
        const err = e as EvaluationError
        expect(err.message).toContain('mystery-node')
      }
    })
  })

  describe('R-EVAL-123: EvaluationError class structure', () => {
    it('should have nodeType property', () => {
      const unknownExpr = {
        type: 'test-node-type',
        value: 'x',
      } as unknown as ExpressionNode
      try {
        evaluator.evaluate(unknownExpr, socialMediaContext)
        expect.fail('Should have thrown')
      } catch (e) {
        expect(e).toBeInstanceOf(EvaluationError)
        const err = e as EvaluationError
        expect(err.nodeType).toBe('test-node-type')
      }
    })

    it('should have expression property', () => {
      const unknownExpr = {
        type: 'test-node',
        value: 'xyz',
      } as unknown as ExpressionNode
      try {
        evaluator.evaluate(unknownExpr, socialMediaContext)
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
    it('should throw EvaluationError for pipe expressions (not yet supported)', () => {
      const pipeExpr = {
        type: 'pipe-expression',
        input: { type: 'identifier', value: 'data' },
        segments: [{ pipeName: 'filter', args: [] }],
      } as unknown as ExpressionNode
      expect(() => evaluator.evaluate(pipeExpr, socialMediaContext)).toThrow(
        EvaluationError,
      )
      expect(() => evaluator.evaluate(pipeExpr, socialMediaContext)).toThrow(
        /pipe/i,
      )
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
    it('should resolve bare identifier from data when scope is empty', () => {
      const context = fromPartialContext({
        data: { user: 'Emma' },
      })
      // Empty scope chain by default
      expect(context.scopeChain.current).toEqual({})

      const expr: IdentifierNode = { type: 'identifier', value: 'user' }
      expect(evaluator.evaluate(expr, context)).toBe('Emma')
    })

    // AC-SCOPE-02: Given context.data.user = "Emma" and context.scope.user = "Carlos",
    // when evaluating `user`, then result is "Carlos" (scope wins)
    it('should resolve bare identifier from scope when both scope and data have value', () => {
      const scopeChain = createEmptyScopeChain()
      write('user', 'Carlos', scopeChain)

      const context = fromPartialContext({
        data: { user: 'Emma' },
        scopeChain,
      })

      const expr: IdentifierNode = { type: 'identifier', value: 'user' }
      expect(evaluator.evaluate(expr, context)).toBe('Carlos')
    })

    it('should resolve bare identifier from parent scope', () => {
      const parent = createEmptyScopeChain()
      write('user', 'Emma', parent)

      const child = pushScope(parent)
      write('tweet', 'Hello!', child)

      const context = fromPartialContext({
        data: {},
        scopeChain: child,
      })

      const expr: IdentifierNode = { type: 'identifier', value: 'user' }
      expect(evaluator.evaluate(expr, context)).toBe('Emma')
    })

    it('should fall back to data when not found in any scope', () => {
      const scopeChain = createEmptyScopeChain()
      write('tweet', 'Hello!', scopeChain)

      const context = fromPartialContext({
        data: { user: 'Emma', followers: 1500 },
        scopeChain,
      })

      const expr: IdentifierNode = { type: 'identifier', value: 'followers' }
      expect(evaluator.evaluate(expr, context)).toBe(1500)
    })
  })

  describe('R-SCOPE-22: Scope chain lookup walks from current to root', () => {
    it('should find value in grandparent scope', () => {
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
      expect(evaluator.evaluate(expr, context)).toBe('Admin')
    })

    it('should return first match when shadowing', () => {
      const parent = createEmptyScopeChain()
      write('item', 'outer', parent)

      const child = pushScope(parent)
      write('item', 'inner', child) // Shadow

      const context = fromPartialContext({
        data: { item: 'data-level' },
        scopeChain: child,
      })

      const expr: IdentifierNode = { type: 'identifier', value: 'item' }
      expect(evaluator.evaluate(expr, context)).toBe('inner')
    })
  })

  describe('R-SCOPE-23: Explicit scope.user resolves via scope chain only', () => {
    // AC-SCOPE-03: Given context.scope.user = "Carlos",
    // when evaluating scope.user, then result is "Carlos"
    it('should resolve scope.user from scope chain', () => {
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
      expect(evaluator.evaluate(expr, context)).toBe('Carlos')
    })

    it('should return undefined when scope.user not in scope chain', () => {
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
      expect(evaluator.evaluate(expr, context)).toBeUndefined()
    })

    it('should walk parent chain for scope.user', () => {
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
      expect(evaluator.evaluate(expr, context)).toBe('Emma')
    })
  })

  describe('R-SCOPE-24: Explicit data.user resolves to context.data.data.user', () => {
    // AC-SCOPE-04: Given context.data.data = { user: "Emma" },
    // when evaluating data.user, then result is "Emma" (no special meaning)
    it('should resolve data.user from context.data.data.user', () => {
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
      expect(evaluator.evaluate(expr, context)).toBe('Emma')
    })

    it('should return undefined when context.data.data.user does not exist', () => {
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
      expect(evaluator.evaluate(expr, context)).toBeUndefined()
    })
  })

  describe('R-SCOPE-25: Member expression uses same resolution for root object', () => {
    // AC-SCOPE-11: Given context.scope.user = { name: "Carlos", followers: 5000 },
    // when evaluating user.followers, then result is 5000 (scope resolution for root)
    it('should resolve root object from scope for member expression', () => {
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
      expect(evaluator.evaluate(expr, context)).toBe(5000)
    })

    it('should resolve root object from data when not in scope', () => {
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
      expect(evaluator.evaluate(expr, context)).toBe(1500)
    })

    it('should handle nested member paths with scope resolution', () => {
      const scopeChain = createEmptyScopeChain()
      write('user', {
        name: 'Carlos',
        profile: {
          settings: { theme: 'light' },
        },
      }, scopeChain)

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
      expect(evaluator.evaluate(expr, context)).toBe('light')
    })
  })
})

// ============================================================================
// EVALUATOR CHANGES FOR SCOPE (R-SCOPE-81 to R-SCOPE-83)
// ============================================================================

describe('ExpressionEvaluator - Scope-Aware Evaluation', () => {
  describe('R-SCOPE-81: evaluate() uses new resolution logic', () => {
    it('should use scope-first resolution in evaluate()', () => {
      const scopeChain = createEmptyScopeChain()
      write('count', 999, scopeChain)

      const context = fromPartialContext({
        data: { count: 42 },
        scopeChain,
      })

      const expr: IdentifierNode = { type: 'identifier', value: 'count' }
      expect(evaluator.evaluate(expr, context)).toBe(999)
    })
  })

  describe('R-SCOPE-82: IdentifierNode resolution walks scope chain then data', () => {
    it('should walk scope chain for identifier', () => {
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
      expect(evaluator.evaluate({ type: 'identifier', value: 'level0' }, context)).toBe('grandparent')
      expect(evaluator.evaluate({ type: 'identifier', value: 'level1' }, context)).toBe('parent')
      expect(evaluator.evaluate({ type: 'identifier', value: 'level2' }, context)).toBe('child')
    })

    it('should fall through to data when not in scope', () => {
      const scopeChain = createEmptyScopeChain()
      write('scopeOnly', 'from-scope', scopeChain)

      const context = fromPartialContext({
        data: { dataOnly: 'from-data' },
        scopeChain,
      })

      expect(evaluator.evaluate({ type: 'identifier', value: 'scopeOnly' }, context)).toBe('from-scope')
      expect(evaluator.evaluate({ type: 'identifier', value: 'dataOnly' }, context)).toBe('from-data')
    })
  })

  describe('R-SCOPE-83: MemberExpressionNode applies scope chain logic to root', () => {
    it('should apply scope resolution to root of member expression', () => {
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
      expect(evaluator.evaluate(expr, context)).toBe(true)
    })

    it('should handle scope.x member expression specially', () => {
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
      expect(evaluator.evaluate(expr, context)).toBe('scope-value')
    })
  })
})
