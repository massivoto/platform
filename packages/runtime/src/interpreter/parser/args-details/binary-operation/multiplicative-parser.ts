import { IGenLex, SingleParser } from '@masala/parser'
import { BinaryExpressionNode, ExpressionNode } from '../../ast.js'
import { chainLeft, makeBinaryNode } from '../../chain-left/chain-left.js'
import { ArgTokens, createArgumentTokens } from '../tokens/argument-tokens.js'
import { atomicParser } from '../tokens/literals-parser.js'
import { createPostfixParser } from '../unary-parser/member-parser.js'
import { unaryParser } from '../unary-parser/unary-parser.js'

export function multiplicativeParser(
  tokens: ArgTokens,
  unary: SingleParser<ExpressionNode>,
): SingleParser<ExpressionNode> {
  const { MULTIPLY, DIV, MODULO } = tokens

  return chainLeft(unary, MULTIPLY.or(DIV).or(MODULO), makeBinaryNode)
}

/**
 * Intermediate building of parsers
 * Especially to simplify tests
 * @param genlex
 */
export function buildMultiplicativeParser(genlex: IGenLex): {
  multiplicative: SingleParser<BinaryExpressionNode>
  tokens: ArgTokens
} {
  const tokens = createArgumentTokens(genlex)
  const primary: SingleParser<ExpressionNode> = atomicParser(tokens)
  const postfix = createPostfixParser(tokens, primary)
  const unary = unaryParser(tokens, postfix)
  const parser = multiplicativeParser(
    tokens,
    postfix.or(unary),
  ) as SingleParser<BinaryExpressionNode>
  return { multiplicative: parser, tokens }
}
