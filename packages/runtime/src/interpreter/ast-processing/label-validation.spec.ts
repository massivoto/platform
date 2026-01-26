import { describe, it, expect } from 'vitest'
import {
  validateLabels,
  LabelValidationError,
  buildLabelIndex,
} from './label-validation.js'
import { buildProgramParser } from '../parser/program-parser.js'

describe('Label Validation (AST Post-Processing)', () => {
  const parser = buildProgramParser()

  function parse(source: string) {
    return parser.val(source)
  }

  describe('R-GOTO-61: Detect duplicate labels', () => {
    it('AC-GOTO-04: Jake uses label="check" twice - error with both locations', () => {
      const source = `
        @utils/set input=1 output=a label="check"
        @utils/set input=2 output=b
        @utils/set input=3 output=c label="check"
      `
      const program = parse(source)

      expect(() => validateLabels(program)).toThrow(LabelValidationError)

      try {
        validateLabels(program)
      } catch (e) {
        const error = e as LabelValidationError
        expect(error.type).toBe('duplicate-label')
        expect(error.label).toBe('check')
        expect(error.locations).toHaveLength(2)
        expect(error.locations).toContain(0) // first instruction
        expect(error.locations).toContain(2) // third instruction
      }
    })

    it('detects multiple duplicate labels', () => {
      const source = `
        @utils/set input=1 output=a label="start"
        @utils/set input=2 output=b label="start"
        @utils/set input=3 output=c label="end"
        @utils/set input=4 output=d label="end"
      `
      const program = parse(source)

      expect(() => validateLabels(program)).toThrow(LabelValidationError)
    })

    it('allows unique labels', () => {
      const source = `
        @utils/set input=1 output=a label="start"
        @utils/set input=2 output=b label="middle"
        @utils/set input=3 output=c label="end"
      `
      const program = parse(source)

      expect(() => validateLabels(program)).not.toThrow()
    })
  })

  describe('R-GOTO-05: @flow/goto without target is an error', () => {
    it('detects @flow/goto missing target argument', () => {
      const source = `
        @utils/set input=1 output=a label="start"
        @flow/goto
        @utils/set input=2 output=b label="end"
      `
      const program = parse(source)

      expect(() => validateLabels(program)).toThrow(LabelValidationError)

      try {
        validateLabels(program)
      } catch (e) {
        const error = e as LabelValidationError
        expect(error.type).toBe('missing-target')
        expect(error.gotoLocation).toBe(1) // instruction index
        expect(error.message).toContain('missing required "target" argument')
      }
    })

    it('detects @flow/goto with non-string target', () => {
      // target={variable} is not a literal string, should be caught
      const source = `
        @utils/set input="myLabel" output=targetName
        @flow/goto target=targetName
      `
      const program = parse(source)

      expect(() => validateLabels(program)).toThrow(LabelValidationError)

      try {
        validateLabels(program)
      } catch (e) {
        const error = e as LabelValidationError
        expect(error.type).toBe('missing-target')
      }
    })

    it('valid @flow/goto with string target passes', () => {
      const source = `
        @utils/set input=1 output=a label="target"
        @flow/goto target="target"
      `
      const program = parse(source)

      expect(() => validateLabels(program)).not.toThrow()
    })
  })

  describe('R-GOTO-62: Detect unknown goto targets', () => {
    it('AC-GOTO-05: Emma uses @flow/goto target="typo" with no matching label', () => {
      const source = `
        @utils/set input=1 output=a label="start"
        @flow/goto target="typo"
        @utils/set input=2 output=b label="end"
      `
      const program = parse(source)

      expect(() => validateLabels(program)).toThrow(LabelValidationError)

      try {
        validateLabels(program)
      } catch (e) {
        const error = e as LabelValidationError
        expect(error.type).toBe('unknown-target')
        expect(error.target).toBe('typo')
        expect(error.gotoLocation).toBe(1) // instruction index
      }
    })

    it('detects multiple unknown targets', () => {
      const source = `
        @flow/goto target="missing1"
        @utils/set input=1 output=a
        @flow/goto target="missing2"
      `
      const program = parse(source)

      expect(() => validateLabels(program)).toThrow(LabelValidationError)
    })

    it('allows valid goto targets', () => {
      const source = `
        @utils/set input=1 output=a label="target"
        @flow/goto target="target"
      `
      const program = parse(source)

      expect(() => validateLabels(program)).not.toThrow()
    })

    it('allows forward references', () => {
      const source = `
        @flow/goto target="later"
        @utils/set input=1 output=a
        @utils/set input=2 output=b label="later"
      `
      const program = parse(source)

      expect(() => validateLabels(program)).not.toThrow()
    })
  })

  describe('R-GOTO-63: Build label index for interpreter', () => {
    it('returns Map<string, number> of label names to instruction indices', () => {
      const source = `
        @utils/set input=1 output=a label="first"
        @utils/set input=2 output=b
        @utils/set input=3 output=c label="third"
      `
      const program = parse(source)

      const index = buildLabelIndex(program)

      expect(index).toBeInstanceOf(Map)
      expect(index.get('first')).toBe(0)
      expect(index.get('third')).toBe(2)
      expect(index.has('second')).toBe(false)
    })

    it('returns empty map for program without labels', () => {
      const source = `
        @utils/set input=1 output=a
        @utils/set input=2 output=b
      `
      const program = parse(source)

      const index = buildLabelIndex(program)

      expect(index.size).toBe(0)
    })
  })

  describe('validateLabels options', () => {
    it('throws on first error by default', () => {
      const source = `
        @utils/set input=1 output=a label="dup"
        @utils/set input=2 output=b label="dup"
        @flow/goto target="missing"
      `
      const program = parse(source)

      // Should throw on the first error (duplicate label)
      try {
        validateLabels(program)
        expect.fail('Should have thrown')
      } catch (e) {
        const error = e as LabelValidationError
        expect(error.type).toBe('duplicate-label')
      }
    })

    it('can collect all errors', () => {
      const source = `
        @utils/set input=1 output=a label="dup"
        @utils/set input=2 output=b label="dup"
        @flow/goto target="missing"
      `
      const program = parse(source)

      const errors = validateLabels(program, { collectAll: true })

      expect(errors).toHaveLength(2)
      expect(errors[0].type).toBe('duplicate-label')
      expect(errors[1].type).toBe('unknown-target')
    })
  })

  describe('Edge cases', () => {
    it('handles empty program', () => {
      const source = ``
      const program = parse(source)

      expect(() => validateLabels(program)).not.toThrow()
    })

    it('handles program with only gotos (all invalid)', () => {
      const source = `
        @flow/goto target="a"
        @flow/goto target="b"
      `
      const program = parse(source)

      expect(() => validateLabels(program)).toThrow(LabelValidationError)
    })

    it('handles case-sensitive labels', () => {
      const source = `
        @utils/set input=1 output=a label="Label"
        @flow/goto target="label"
      `
      const program = parse(source)

      // "Label" !== "label" - should fail
      expect(() => validateLabels(program)).toThrow(LabelValidationError)
    })
  })
})
