import { C, F, N, SingleParser } from '@masala/parser'
import { quote } from './args-details/argument-simple-parsers.js'

export const oneSpace = C.char(' ')
  .or(C.char('\t'))
  .or(C.char('\n'))
  .or(F.eos())
export const spaces = oneSpace.rep()

const reservedWords = [
  'true',
  'false',
  'for',
  'forEach',
  'for-each',
  'in',
  'if',
  'else',
  'endif',
  'repeat',
  'while',
  'function',
  'return',
  'break',
  'continue',
  'switch',
  'case',
  'default',
  'let',
  'const',
  'var',
  'output', // reserved for output=identifier
]

export const identifier = F.regex(/[a-zA-Z_][a-zA-Z0-9_-]*/)
  .filter((s) => s.charAt(s.length - 1) !== '-')
  .filter((s) => !reservedWords.includes(s))

export const numberLiteral = N.number()

export const booleanLiteral: SingleParser<boolean> = C.stringIn([
  'true',
  'false',
]).map((v) => v === 'true')
// Process escape sequences in a string: \", \\, \n, \t
function processEscapes(str: string): string {
  return str.replace(/\\(["\\/nt])/g, (_, char) => {
    switch (char) {
      case 'n':
        return '\n'
      case 't':
        return '\t'
      default:
        return char // " or \ or /
    }
  })
}

// String literal: matches "..." and processes escape sequences
// Matches any char except unescaped " or literal newline
export const stringLiteral = quote
  .then(
    C.char('\\')
      .then(C.charIn('"\\nt'))
      .or(F.not(C.charIn('"\n')))
      .optrep(),
  )
  .then(quote)
  .map((tuple) => {
    const raw = tuple
      .array()
      .flat()
      .join('')
    // raw includes quotes, remove them and process escapes
    return processEscapes(raw.slice(1, -1))
  })
