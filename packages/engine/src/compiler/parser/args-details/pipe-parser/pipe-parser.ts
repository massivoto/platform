import { SingleParser, Tuple } from '@masala/parser'
import { MixedTuple } from '@masala/parser/typings/tuple.js'
import { SimpleExpressionNode } from '../../ast.js'
import { ArgTokens } from '../tokens/argument-tokens.js'

// | QualifiedNameNode; (if we use registry sme days)
export interface PipeSegment {
  pipeName: string
  args: SimpleExpressionNode[] // maybe empty
}

export interface PipeExpressionNode {
  type: 'pipe-expression'
  input: SimpleExpressionNode
  segments: PipeSegment[] // never empty
}

export function createPipeParser(
  tokens: ArgTokens,
  simpleExpression: SingleParser<SimpleExpressionNode>,
): SingleParser<PipeExpressionNode> {
  const { OPEN, CLOSE, PIPE, COLON, IDENTIFIER } = tokens
  const pipeName = IDENTIFIER.map((t) => t.value)

  const pipeArgument = COLON.drop()
    .then(simpleExpression)
    .map((t) => t.single())
  const pipeSegment: SingleParser<PipeSegment> = PIPE.drop()
    .then(pipeName)
    .then(pipeArgument.optrep())
    .map((t: MixedTuple<string, SimpleExpressionNode>) => {
      const pipeName = t.first()
      const args = t.array().slice(1) as SimpleExpressionNode[]
      return {
        pipeName,
        args,
      }
    })
  const pipeParser: SingleParser<PipeExpressionNode> = OPEN.drop()
    .then(simpleExpression)
    .then(pipeSegment.rep())
    .then(CLOSE.drop())
    .map((t: MixedTuple<SimpleExpressionNode, PipeSegment[]>) => {
      const input = t.first()
      const segments = t.array().slice(1) as PipeSegment[]
      return {
        type: 'pipe-expression',
        input,
        segments,
      } as PipeExpressionNode
    })

  return pipeParser
}
