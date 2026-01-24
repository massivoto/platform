/**
 * Strip comments from OTO source code.
 *
 * Handles:
 * - Line comments: // to end of line
 * - Block comments: delimited by slash-asterisk and asterisk-slash
 * - String awareness: comments inside "..." are NOT stripped
 *
 * @throws Error if block comment is unclosed
 */

const enum State {
  NORMAL,
  IN_STRING,
  IN_LINE_COMMENT,
  IN_BLOCK_COMMENT,
}

export function stripComments(source: string): string {
  let state = State.NORMAL
  let result = ''
  let i = 0
  // Track position where potential trailing whitespace starts before a line comment
  let whitespaceStartBeforeComment = -1

  while (i < source.length) {
    const char = source[i]
    const nextChar = source[i + 1]

    switch (state) {
      case State.NORMAL:
        if (char === '"') {
          state = State.IN_STRING
          whitespaceStartBeforeComment = -1
          result += char
          i++
        } else if (char === '/' && nextChar === '/') {
          state = State.IN_LINE_COMMENT
          // Don't add the // to result, whitespace before it is already in result
          // We'll decide whether to trim it when we see if newline follows
          i += 2
        } else if (char === '/' && nextChar === '*') {
          state = State.IN_BLOCK_COMMENT
          whitespaceStartBeforeComment = -1
          i += 2
        } else if (char === ' ' || char === '\t') {
          // Track where whitespace starts
          if (whitespaceStartBeforeComment === -1) {
            whitespaceStartBeforeComment = result.length
          }
          result += char
          i++
        } else if (char === '\n' || char === '\r') {
          // Newline resets whitespace tracking
          whitespaceStartBeforeComment = -1
          result += char
          i++
        } else {
          // Non-whitespace resets the tracker
          whitespaceStartBeforeComment = -1
          result += char
          i++
        }
        break

      case State.IN_STRING:
        if (char === '\\' && nextChar !== undefined) {
          // Escaped character - include both backslash and next char
          result += char + nextChar
          i += 2
        } else if (char === '"') {
          // End of string
          state = State.NORMAL
          result += char
          i++
        } else {
          result += char
          i++
        }
        break

      case State.IN_LINE_COMMENT:
        if (char === '\r' && nextChar === '\n') {
          // CRLF line ending - preserve trailing whitespace before the comment
          // and emit the full CRLF sequence
          whitespaceStartBeforeComment = -1
          state = State.NORMAL
          result += '\r\n'
          i += 2
        } else if (char === '\n') {
          // LF-only line ending - trim trailing whitespace before the comment
          if (whitespaceStartBeforeComment !== -1) {
            result = result.slice(0, whitespaceStartBeforeComment)
          }
          whitespaceStartBeforeComment = -1
          state = State.NORMAL
          result += char
          i++
        } else {
          // Skip the comment character (including standalone CR)
          i++
        }
        break

      case State.IN_BLOCK_COMMENT:
        if (char === '*' && nextChar === '/') {
          // End of block comment
          state = State.NORMAL
          i += 2
        } else {
          // Skip the comment character (including newlines)
          i++
        }
        break
    }
  }

  // Check for unclosed block comment at end of input
  if (state === State.IN_BLOCK_COMMENT) {
    throw new Error('Unclosed block comment')
  }

  return result
}
