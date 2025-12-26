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
  // 'forEach', TODO: needed for forEach syntactic sugar
  'for-each',
  'in',
  // 'if', TODO: needed for if syntactic sugar
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
]

export const identifier = F.regex(/[a-zA-Z_][a-zA-Z0-9_-]*/)
  .filter((s) => s.charAt(s.length - 1) !== '-')
  .filter((s) => !reservedWords.includes(s))

export const numberLiteral = N.number()

export const booleanLiteral: SingleParser<boolean> = C.stringIn([
  'true',
  'false',
]).map((v) => v === 'true')
export const stringLiteral = quote
  .then(F.not(C.charIn('"\n')).rep())
  .then(quote)
  .join()
