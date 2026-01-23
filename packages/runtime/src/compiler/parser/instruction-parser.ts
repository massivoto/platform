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
  LabelArgNode,
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
  LABEL_KEY: SingleParser<'label='>
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
    LABEL_KEY: genlex
      .tokenize(C.string('label='), 'LABEL_KEY', 500)
      .map(leanToken) as SingleParser<'label='>,
  }
}

/**
 * Regex pattern for valid label names.
 * Must start with letter or underscore, followed by letters, numbers, underscores, or hyphens.
 * Pattern: ^[a-zA-Z_][a-zA-Z0-9_-]*$
 */
const LABEL_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_-]*$/

/**
 * Note: this function is ok for now, but next addition
 * in a fuure iteration will have to think on splitting it as
 * it may become too complex
 * @param tokens
 */
export function createInstructionGrammar(
  tokens: InstructionTokens,
): SingleParser<InstructionNode> {
  const regularArg = createArgGrammar(tokens)
  const { ACTION, OUTPUT_KEY, IF_KEY, FOREACH_KEY, LABEL_KEY, IDENTIFIER, DOT, STRING } = tokens

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

  // label="name" - LABEL_KEY is dropped, must be a string literal matching identifier pattern
  // R-GOTO-03: Must be a simple string literal (not expression, not identifier)
  // R-GOTO-04: Must match pattern ^[a-zA-Z_][a-zA-Z0-9_-]*$
  const labelArg: SingleParser<LabelArgNode> = LABEL_KEY.drop()
    .then(STRING)
    .filter((tuple) => {
      const stringNode = tuple.single() as { type: 'literal-string'; value: string }
      return LABEL_PATTERN.test(stringNode.value)
    })
    .map((tuple) => {
      const stringNode = tuple.single() as { type: 'literal-string'; value: string }
      return {
        type: 'label-arg' as const,
        name: stringNode.value,
      }
    })

  // Combined reserved arg parser with backtracking
  const reservedArg = F.try(outputArg).or(F.try(ifArg)).or(F.try(forEachArg)).or(labelArg)

  // Any arg: try reserved first, then regular
  const anyArg = F.try(reservedArg).or(regularArg)

  const instruction = ACTION.then(anyArg.optrep()).map((t) => {
    const action = t.first()
    const allArgs = t.array().slice(1) as (
      | ArgumentNode
      | OutputArgNode
      | IfArgNode
      | ForEachArgNode
      | LabelArgNode
    )[]

    // Separate reserved args from regular args
    const regularArgs: ArgumentNode[] = []
    let output: IdentifierNode | undefined
    let condition: ExpressionNode | undefined
    let forEach: ForEachArgNode | undefined
    let label: string | undefined

    for (const arg of allArgs) {
      if (arg.type === 'output-arg') {
        output = arg.target
      } else if (arg.type === 'if-arg') {
        condition = arg.condition
      } else if (arg.type === 'forEach-arg') {
        forEach = arg
      } else if (arg.type === 'label-arg') {
        label = arg.name
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
      label,
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
