import { IGenLex, SingleParser, leanToken } from '@masala/parser'
import { identifier } from '../shared-parser.js'

export interface ActionTokens {
  AT: SingleParser<'@'>
  SLASH: SingleParser<'/'>
  PACKAGE: SingleParser<string>
  FUNCTION: SingleParser<string>
}

export function createActionTokens(genlex: IGenLex): ActionTokens {
  const [AT, SLASH] = genlex.keywords(['@', '/'])

  // Identifier cannot be ambiguous with @
  const IDENTIFIER = genlex.tokenize(identifier, 'IDENTIFIER')

  return {
    AT: AT.map(leanToken) as SingleParser<'@'>,
    SLASH: SLASH.map(leanToken) as SingleParser<'/'>,
    PACKAGE: IDENTIFIER.map((t) => t.value),
    FUNCTION: IDENTIFIER.map((t) => t.value),
  }
}
