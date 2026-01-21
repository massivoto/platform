import { C, F, GenLex, IGenLex, leanToken, SingleParser, TracingGenLex } from '@masala/parser'
import { createArgGrammar } from './arg-parser.js'
import {
  ArgTokens,
  createArgumentTokens,
} from './args-details/tokens/argument-tokens.js'

import {
  ArgumentNode,
  ActionNode,
  ExpressionNode,
  ForEachArgNode,
  IdentifierNode,
  IfArgNode,
  InstructionNode,
  MapperExpressionNode,
  OutputArgNode,
  SingleStringNode,
} from './ast.js'
import { buildActionParser } from './action/action-parser.js'
import { createExpressionWithPipe } from './args-details/full-expression-parser.js'

export interface InstructionTokens extends ArgTokens {
  ACTION: SingleParser<ActionNode>
  OUTPUT_KEY: SingleParser<'output='>
  IF_KEY: SingleParser<'if='>
  FOREACH_KEY: SingleParser<'forEach='>
}

function getInstructionTokens(genlex: IGenLex): InstructionTokens {
  // Action parser uses its own GenLex with no separators to reject "@pkg/ name" with internal spaces
  const actionParser = buildActionParser()

  return {
    ...createArgumentTokens(genlex),
    // Register action as a single token with high priority, unwrap with leanToken (convention)
    ACTION: genlex.tokenize(actionParser, 'ACTION', 3000).map(leanToken),
    // Reserved arg tokens: priority 500 (lower = higher priority, tried before IDENTIFIER at 1000)
    // C.string() ensures no whitespace - literal match only (strict: output= not output =)
    OUTPUT_KEY: genlex
      .tokenize(C.string('output='), 'OUTPUT_KEY', 500)
      .map(leanToken) as SingleParser<'output='>,
    IF_KEY: genlex
      .tokenize(C.string('if='), 'IF_KEY', 500)
      .map(leanToken) as SingleParser<'if='>,
    FOREACH_KEY: genlex
      .tokenize(C.string('forEach='), 'FOREACH_KEY', 500)
      .map(leanToken) as SingleParser<'forEach='>,
  }
}

export function createInstructionGrammar(
  tokens: InstructionTokens,
): SingleParser<InstructionNode> {
  const regularArg = createArgGrammar(tokens)
  const { ACTION, OUTPUT_KEY, IF_KEY, FOREACH_KEY, IDENTIFIER, DOT } = tokens

  // Expression parser for if= value (includes mapper expression support)
  const expression = createExpressionWithPipe(tokens)

  // Dotted path parser: identifier(.identifier)* -> joined as "scope.user.profile"
  // Used for output targets like output=scope.user
  const dottedPath = IDENTIFIER.then(DOT.drop().then(IDENTIFIER).optrep()).map(
    (tuple) => {
      const first = tuple.first() as IdentifierNode
      const rest = tuple.array().slice(1) as IdentifierNode[]
      const fullPath = [first.value, ...rest.map((id) => id.value)].join('.')
      return { type: 'identifier' as const, value: fullPath }
    },
  )

  // Reserved arg parsers
  // output=identifier or output=scope.user - OUTPUT_KEY is dropped, path becomes the target
  const outputArg: SingleParser<OutputArgNode> = OUTPUT_KEY.drop()
    .then(dottedPath)
    .map((tuple) => ({
      type: 'output-arg' as const,
      target: tuple.single() as IdentifierNode,
    }))

  // if=expression - IF_KEY is dropped, expression becomes the condition
  const ifArg: SingleParser<IfArgNode> = IF_KEY.drop()
    .then(expression)
    .map((tuple) => ({
      type: 'if-arg' as const,
      condition: tuple.single() as ExpressionNode,
    }))

  // forEach=mapperExpression - FOREACH_KEY is dropped, must be a mapper expression
  // e.g. forEach=users -> user, forEach={users|filter:active} -> user
  // Use filter() to reject non-mapper expressions instead of throwing in map()
  const forEachArg: SingleParser<ForEachArgNode> = FOREACH_KEY.drop()
    .then(expression)
    .filter((tuple) => {
      const expr = tuple.single() as ExpressionNode
      return expr.type === 'mapper'
    })
    .map((tuple) => {
      const mapperExpr = tuple.single() as MapperExpressionNode
      return {
        type: 'forEach-arg' as const,
        iterable: mapperExpr.source,
        iterator: mapperExpr.target,
      }
    })

  // Combined reserved arg parser with backtracking
  const reservedArg = F.try(outputArg).or(F.try(ifArg)).or(forEachArg)

  // Any arg: try reserved first, then regular
  const anyArg = F.try(reservedArg).or(regularArg)

  const instruction = ACTION.then(anyArg.optrep()).map((t) => {
    const action = t.first()
    const allArgs = t.array().slice(1) as (
      | ArgumentNode
      | OutputArgNode
      | IfArgNode
      | ForEachArgNode
    )[]

    // Separate reserved args from regular args
    const regularArgs: ArgumentNode[] = []
    let output: IdentifierNode | undefined
    let condition: ExpressionNode | undefined
    let forEach: ForEachArgNode | undefined

    for (const arg of allArgs) {
      if (arg.type === 'output-arg') {
        output = arg.target
      } else if (arg.type === 'if-arg') {
        condition = arg.condition
      } else if (arg.type === 'forEach-arg') {
        forEach = arg
      } else {
        regularArgs.push(arg)
      }
    }

    const instructionNode: InstructionNode = {
      type: 'instruction',
      action,
      args: regularArgs,
      output,
      condition,
      forEach,
    }
    return instructionNode
  })
  return instruction as SingleParser<InstructionNode>
}

export function buildInstructionParserForTest(): SingleParser<InstructionNode> {
  const genlex = new TracingGenLex()
  const tokens = getInstructionTokens(genlex)
  const grammar = createInstructionGrammar(tokens)
  return genlex.use(grammar)
}

export function buildInstructionParser(): SingleParser<InstructionNode> {
  const genlex = new TracingGenLex()
  const tokens = getInstructionTokens(genlex)
  return genlex.use(createInstructionGrammar(tokens))
}
