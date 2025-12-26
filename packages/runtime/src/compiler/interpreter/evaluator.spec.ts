import { nowReadable } from '@massivoto/kit'
import { describe, it, expect } from 'vitest'
import { fakeStorePointer } from '../../domain/store.js'
import { IdentifierNode, LiteralStringNode } from '../parser/ast.js'
import { ExpressionEvaluator } from './evaluators.js'
import {
  ExecutionContext,
  fromPartialContext,
} from '../../domain/execution-context.js'

const evaluator = new ExpressionEvaluator()

const baseContext: ExecutionContext = fromPartialContext({
  data: {
    tweets: [{ id: 'a' }, { id: 'b' }],
    names: ['john', 'mary'],
    count: 3,
  },
  user: {
    id: 'john@doe.com',
    extra: {},
  },
})

describe('ExpressionEvaluator', () => {
  it('should evaluate a literal string', () => {
    const expr: LiteralStringNode = { type: 'literal-string', value: 'hello' }
    expect(evaluator.evaluate(expr, baseContext)).toBe('hello')
  })

  it('should evaluate an identifier', () => {
    const expr: IdentifierNode = { type: 'identifier', value: 'names' }
    expect(evaluator.evaluate(expr, baseContext)).toEqual(['john', 'mary'])
  })

  /*it('should evaluate a pipe with mappedBy', () => {
    const expr: PipeExpressionNode = {
      type: 'pipe',
      input: { type: 'identifier', value: 'tweets' },
      name: 'mappedBy',
      args: [{ type: 'literal-string', value: 'id' }],
    }

    expect(evaluator.evaluate(expr, baseContext)).toEqual(['a', 'b'])
  })

  it('should evaluate a pipe with tail', () => {
    const expr: PipeExpressionNode = {
      type: 'pipe',
      input: { type: 'identifier', value: 'names' },
      name: 'tail',
      args: [{ type: 'literal-number', value: 1 }],
    }

    expect(evaluator.evaluate(expr, baseContext)).toEqual(['mary'])
  })*/
})
