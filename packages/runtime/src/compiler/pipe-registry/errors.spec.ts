/**
 * Pipe Registry Error Tests
 *
 * Requirements tested:
 * - R-PIPE-61: PipeError class with pipeId and message properties
 * - R-PIPE-62: PipeArgumentError extends PipeError with expectedArgs hint
 * - R-PIPE-63: PipeTypeError extends PipeError for input type mismatches
 */
import { describe, it, expect } from 'vitest'
import { PipeError, PipeArgumentError, PipeTypeError } from './errors.js'

describe('PipeError', () => {
  describe('R-PIPE-61: PipeError class with pipeId and message', () => {
    it('should have name "PipeError"', () => {
      const error = new PipeError('filter', 'Something went wrong')

      expect(error.name).toBe('PipeError')
    })

    it('should store pipeId property', () => {
      const error = new PipeError('filter', 'Something went wrong')

      expect(error.pipeId).toBe('filter')
    })

    it('should include pipeId in error message', () => {
      const error = new PipeError('map', 'Invalid operation')

      expect(error.message).toContain('map')
      expect(error.message).toContain('Invalid operation')
    })

    it('should be an instance of Error', () => {
      const error = new PipeError('filter', 'Test error')

      expect(error).toBeInstanceOf(Error)
    })
  })
})

describe('PipeArgumentError', () => {
  describe('R-PIPE-62: PipeArgumentError extends PipeError with expectedArgs', () => {
    it('should have name "PipeArgumentError"', () => {
      const error = new PipeArgumentError('filter', 'property name (string)')

      expect(error.name).toBe('PipeArgumentError')
    })

    it('should extend PipeError', () => {
      const error = new PipeArgumentError('filter', 'property name (string)')

      expect(error).toBeInstanceOf(PipeError)
      expect(error).toBeInstanceOf(Error)
    })

    it('should store pipeId property', () => {
      const error = new PipeArgumentError('map', 'property name (string)')

      expect(error.pipeId).toBe('map')
    })

    it('should store expectedArgs hint', () => {
      const error = new PipeArgumentError('filter', 'property name (string)')

      expect(error.expectedArgs).toBe('property name (string)')
    })

    it('should include expectedArgs in error message', () => {
      const error = new PipeArgumentError('filter', 'property name (string)')

      expect(error.message).toContain('filter')
      expect(error.message).toContain('property name (string)')
    })

    it('should provide actionable message format', () => {
      const error = new PipeArgumentError(
        'join',
        'separator (string, optional)',
      )

      // Message should help LLMs understand how to fix
      expect(error.message).toMatch(/expected|requires|argument/i)
    })
  })
})

describe('PipeTypeError', () => {
  describe('R-PIPE-63: PipeTypeError extends PipeError for input type mismatches', () => {
    it('should have name "PipeTypeError"', () => {
      const error = new PipeTypeError('filter', 'array', 'number')

      expect(error.name).toBe('PipeTypeError')
    })

    it('should extend PipeError', () => {
      const error = new PipeTypeError('filter', 'array', 'number')

      expect(error).toBeInstanceOf(PipeError)
      expect(error).toBeInstanceOf(Error)
    })

    it('should store pipeId property', () => {
      const error = new PipeTypeError('map', 'array', 'string')

      expect(error.pipeId).toBe('map')
    })

    it('should store expectedType property', () => {
      const error = new PipeTypeError('filter', 'array', 'number')

      expect(error.expectedType).toBe('array')
    })

    it('should store actualType property', () => {
      const error = new PipeTypeError('filter', 'array', 'number')

      expect(error.actualType).toBe('number')
    })

    it('should format message as: Pipe X requires Y input, got Z', () => {
      const error = new PipeTypeError('filter', 'array', 'number')

      expect(error.message).toBe(
        "Pipe 'filter' requires array input, got number",
      )
    })

    it('should handle complex type descriptions', () => {
      const error = new PipeTypeError(
        'length',
        'array, string, or object',
        'function',
      )

      expect(error.message).toBe(
        "Pipe 'length' requires array, string, or object input, got function",
      )
    })
  })
})
