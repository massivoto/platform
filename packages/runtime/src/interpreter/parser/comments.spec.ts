import { describe, it, expect } from 'vitest'
import { stripComments } from './comments.js'

describe('stripComments', () => {
  describe('Line Comments (R-CMT-01 to R-CMT-03)', () => {
    it('R-CMT-01: // starts a line comment, everything after is ignored', () => {
      const input = '@api/call endpoint="/users"  // fetch all users'
      const result = stripComments(input)
      expect(result).toBe('@api/call endpoint="/users"  ')
    })

    it('R-CMT-02: Line with only comment produces empty line', () => {
      const input = '// This is a comment-only line'
      const result = stripComments(input)
      expect(result).toBe('')
    })

    it('R-CMT-03: // at start of line comments entire line', () => {
      const input = `// @api/call endpoint="/disabled"
@api/call endpoint="/active"`
      const result = stripComments(input)
      expect(result).toBe(`
@api/call endpoint="/active"`)
    })

    it('should handle multiple line comments on consecutive lines', () => {
      const input = `// comment 1
// comment 2
@api/call endpoint="/users"`
      const result = stripComments(input)
      expect(result).toBe(`

@api/call endpoint="/users"`)
    })

    it('should preserve newlines after line comment', () => {
      const input = `@api/call endpoint="/a" // comment
@api/call endpoint="/b"`
      const result = stripComments(input)
      expect(result).toBe(`@api/call endpoint="/a"
@api/call endpoint="/b"`)
    })
  })

  describe('Block Comments (R-CMT-21 to R-CMT-24)', () => {
    it('R-CMT-21: /* starts block comment, */ ends it', () => {
      const input = '@api/call /* inline comment */ endpoint="/users"'
      const result = stripComments(input)
      expect(result).toBe('@api/call  endpoint="/users"')
    })

    it('R-CMT-22: Block comments can span multiple lines', () => {
      const input = `/*
 * Multi-line comment
 * describing the workflow
 */
@api/call endpoint="/users"`
      const result = stripComments(input)
      expect(result).toBe(`
@api/call endpoint="/users"`)
    })

    it('R-CMT-23: Block comments can appear mid-line', () => {
      const input = '@api/call endpoint=/* old: "/v1" */ "/v2"'
      const result = stripComments(input)
      expect(result).toBe('@api/call endpoint= "/v2"')
    })

    it('R-CMT-24: Multiple block comments on same line', () => {
      const input = '@api/call /* a */ endpoint="/users" /* b */'
      const result = stripComments(input)
      expect(result).toBe('@api/call  endpoint="/users" ')
    })

    it('should handle block comment at end of line', () => {
      const input = '@api/call endpoint="/users" /* trailing */'
      const result = stripComments(input)
      expect(result).toBe('@api/call endpoint="/users" ')
    })

    it('should handle block comment spanning 3+ lines', () => {
      const input = `/* line 1
line 2
line 3 */@api/call endpoint="/users"`
      const result = stripComments(input)
      expect(result).toBe('@api/call endpoint="/users"')
    })
  })

  describe('String Awareness (R-CMT-41 to R-CMT-43)', () => {
    it('R-CMT-41: // inside string literal is NOT a comment', () => {
      const input = '@log/print msg="https://example.com"'
      const result = stripComments(input)
      expect(result).toBe('@log/print msg="https://example.com"')
    })

    it('R-CMT-42: /* */ inside string literal is NOT a comment', () => {
      const input = '@log/print msg="/* not a comment */"'
      const result = stripComments(input)
      expect(result).toBe('@log/print msg="/* not a comment */"')
    })

    it('R-CMT-43: Escaped quotes inside strings are handled correctly', () => {
      const input = '@log/print msg="say \\"hello\\" // world"'
      const result = stripComments(input)
      expect(result).toBe('@log/print msg="say \\"hello\\" // world"')
    })

    it('should preserve URL with protocol in string', () => {
      const input =
        '@api/call url="https://api.example.com/v1/users" // comment'
      const result = stripComments(input)
      expect(result).toBe('@api/call url="https://api.example.com/v1/users" ')
    })

    it('should handle multiple strings on same line', () => {
      const input = '@log/print a="hello // world" b="foo /* bar */ baz"'
      const result = stripComments(input)
      expect(result).toBe('@log/print a="hello // world" b="foo /* bar */ baz"')
    })

    it('should handle string with escaped backslash before quote', () => {
      const input = '@log/print msg="path\\\\dir" // comment'
      const result = stripComments(input)
      expect(result).toBe('@log/print msg="path\\\\dir" ')
    })

    it('should handle empty string followed by comment', () => {
      const input = '@log/print msg="" // empty'
      const result = stripComments(input)
      expect(result).toBe('@log/print msg="" ')
    })
  })

  describe('Error Handling (R-CMT-61 to R-CMT-62)', () => {
    it('R-CMT-61: Unclosed block comment produces descriptive error', () => {
      const input = `/* this comment never ends
@api/call endpoint="/users"`
      expect(() => stripComments(input)).toThrow('Unclosed block comment')
    })

    it('should throw on unclosed block comment at end of file', () => {
      const input = '@api/call endpoint="/users" /*'
      expect(() => stripComments(input)).toThrow('Unclosed block comment')
    })

    it('R-CMT-62: Unclosed string passes through (not comment stripper concern)', () => {
      // The comment stripper should not throw for unclosed strings
      // That error should come from the instruction parser
      const input = '@log/print msg="unclosed'
      // Should not throw - just returns the input as-is since it stays in IN_STRING state
      const result = stripComments(input)
      expect(result).toBe('@log/print msg="unclosed')
    })
  })

  describe('Acceptance Criteria', () => {
    it('AC-CMT-01: Given trailing comment, instruction has no trace of comment', () => {
      const input = '@api/call endpoint="/users" // comment'
      const result = stripComments(input)
      expect(result).not.toContain('//')
      expect(result).not.toContain('comment')
      expect(result).toContain('@api/call endpoint="/users"')
    })

    it('AC-CMT-02: Line with only comment produces no content', () => {
      const input = '// comment only'
      const result = stripComments(input)
      expect(result.trim()).toBe('')
    })

    it('AC-CMT-03: Multi-line block comment before instruction leaves single instruction', () => {
      const input = `/* multi
line */ @api/call endpoint="/users"`
      const result = stripComments(input)
      expect(result).toBe(' @api/call endpoint="/users"')
    })

    it('AC-CMT-04: URL in string is preserved', () => {
      const input = '@log/print msg="https://example.com"'
      const result = stripComments(input)
      expect(result).toBe('@log/print msg="https://example.com"')
    })

    it('AC-CMT-05: Block comment syntax in string is preserved', () => {
      const input = '@log/print msg="/* keep */"'
      const result = stripComments(input)
      expect(result).toContain('/* keep */')
    })

    it('AC-CMT-06: Unclosed block comment throws descriptive error', () => {
      const input = '/* unclosed'
      expect(() => stripComments(input)).toThrow(/unclosed block comment/i)
    })

    it('AC-CMT-07: Multiple block comments in single instruction', () => {
      const input = '@api/call /* a */ endpoint /* b */ ="/users"'
      const result = stripComments(input)
      expect(result).toBe('@api/call  endpoint  ="/users"')
      // Should be parseable - just stripped
    })

    it('AC-CMT-08: Escaped quote in string preserves comment-like content', () => {
      const input = '@log/print msg="a\\"b // c"'
      const result = stripComments(input)
      expect(result).toContain('// c')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      expect(stripComments('')).toBe('')
    })

    it('should handle input with no comments', () => {
      const input = '@api/call endpoint="/users"'
      expect(stripComments(input)).toBe(input)
    })

    it('should handle only whitespace', () => {
      expect(stripComments('   ')).toBe('   ')
    })

    it('should handle // immediately followed by newline', () => {
      const input = `@api/call //
endpoint="/users"`
      const result = stripComments(input)
      expect(result).toBe(`@api/call
endpoint="/users"`)
    })

    it('should handle /* immediately followed by */', () => {
      const input = '@api/call /**/ endpoint="/users"'
      const result = stripComments(input)
      expect(result).toBe('@api/call  endpoint="/users"')
    })

    it('should handle line comment inside block comment', () => {
      const input = '@api/call /* // nested */ endpoint="/users"'
      const result = stripComments(input)
      expect(result).toBe('@api/call  endpoint="/users"')
    })

    it('should handle block comment start inside line comment', () => {
      const input = `@api/call // /* not a block
endpoint="/users"`
      const result = stripComments(input)
      expect(result).toBe(`@api/call
endpoint="/users"`)
    })

    it('should handle block comment end sequence in string', () => {
      const input = '@log/print msg="*/" /* real comment */'
      const result = stripComments(input)
      expect(result).toBe('@log/print msg="*/" ')
    })

    it('should handle consecutive block comments', () => {
      const input = '@api/call /* a *//* b */ endpoint="/users"'
      const result = stripComments(input)
      expect(result).toBe('@api/call  endpoint="/users"')
    })

    it('should handle CRLF line endings', () => {
      const input = '@api/call // comment\r\n@set value=1'
      const result = stripComments(input)
      expect(result).toBe('@api/call \r\n@set value=1')
    })

    it('should handle CR only line endings', () => {
      const input = '@api/call // comment\r@set value=1'
      const result = stripComments(input)
      // CR alone does not end line comment (only \n does)
      expect(result).toBe('@api/call ')
    })

    it('should handle single slash (not a comment)', () => {
      const input = '@api/call path="/users/1"'
      const result = stripComments(input)
      expect(result).toBe('@api/call path="/users/1"')
    })

    it('should handle single asterisk (not a comment)', () => {
      const input = '@calc expr="2 * 3"'
      const result = stripComments(input)
      expect(result).toBe('@calc expr="2 * 3"')
    })

    it('should handle slash followed by asterisk in string', () => {
      const input = '@log/print msg="a /* b"'
      const result = stripComments(input)
      expect(result).toBe('@log/print msg="a /* b"')
    })

    it('should handle asterisk followed by slash in string (not closing block)', () => {
      const input = '@log/print msg="a */ b"'
      const result = stripComments(input)
      expect(result).toBe('@log/print msg="a */ b"')
    })
  })
})
