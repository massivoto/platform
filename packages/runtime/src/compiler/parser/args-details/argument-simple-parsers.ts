import { C, F, GenLex, N, SingleParser } from '@masala/parser'

import { identifier } from '../shared-parser.js'

export const bangParser = C.char('!')
export const plusParser = C.char('+')
export const minusParser = C.char('-')

export const equal = C.char('=')
export const quote = C.char('"')

export const simpleString = F.regex(/[a-zA-Z_0-9-'`$&€£%!@.;?/+*]+/)
  .filter((v) => isNaN(Number(v)))
  .filter((value) => !identifier.thenEos().val(value))

export const parentheses = C.charIn('()') as SingleParser<'(' | ')'>
export const left_parenthesis = C.char('(') as SingleParser<'('>
export const right_parenthesis = C.char(')') as SingleParser<')'>

export const multiplyOps = C.charIn('*/%') as SingleParser<'*' | '/' | '%'>
export const additionOps = C.charIn('+-') as SingleParser<'+' | '-'>
export const compareOps = F.satisfy(
  (c: string) => c === '<' || c === '<=' || c === '>' || c === '>=',
) as SingleParser<'<' | '<=' | '>' | '>='>
export const equalityOp = F.satisfy(
  (c: string) => c === '==' || c === '!=',
) as SingleParser<'==' | '!='>
export const logicalOps = C.stringIn(['&&', '||']) as SingleParser<'&&' | '||'>
