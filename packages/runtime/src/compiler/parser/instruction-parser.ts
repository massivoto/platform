import { C, F, GenLex, IGenLex, leanToken, SingleParser } from '@masala/parser'
import { createArgGrammar } from './arg-parser.js'
import {
  ArgTokens,
  createArgumentTokens,
} from './args-details/tokens/argument-tokens.js'

import {
  ArgumentNode,
  ActionNode,
  ExpressionNode,
  IdentifierNode,
  IfArgNode,
  InstructionNode,
  OutputArgNode,
} from './ast.js'
import { buildActionParser } from './action/action-parser.js'
import { createExpressionWithPipe } from './args-details/full-expression-parser.js'

export interface InstructionTokens extends ArgTokens {
  ACTION: SingleParser<ActionNode>
  OUTPUT_KEY: SingleParser<'output='>
  IF_KEY: SingleParser<'if='>
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
  }
}

export function createInstructionGrammar(
  tokens: InstructionTokens,
): SingleParser<InstructionNode> {
  const regularArg = createArgGrammar(tokens)
  const { ACTION, OUTPUT_KEY, IF_KEY, IDENTIFIER } = tokens

  // Expression parser for if= value
  const expression = createExpressionWithPipe(tokens)

  // Reserved arg parsers
  // output=identifier - OUTPUT_KEY is dropped, IDENTIFIER becomes the target
  const outputArg: SingleParser<OutputArgNode> = OUTPUT_KEY.drop()
    .then(IDENTIFIER)
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

  // Combined reserved arg parser with backtracking
  const reservedArg = F.try(outputArg).or(ifArg)

  // Any arg: try reserved first, then regular
  const anyArg = F.try(reservedArg).or(regularArg)

  const instruction = ACTION.then(anyArg.optrep()).map((t) => {
    const action = t.first()
    const allArgs = t.array().slice(1) as (ArgumentNode | OutputArgNode | IfArgNode)[]

    // Separate reserved args from regular args
    const regularArgs: ArgumentNode[] = []
    let output: IdentifierNode | undefined
    let condition: ExpressionNode | undefined

    for (const arg of allArgs) {
      if (arg.type === 'output-arg') {
        output = arg.target
      } else if (arg.type === 'if-arg') {
        condition = arg.condition
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
    }
    return instructionNode
  })
  return instruction as SingleParser<InstructionNode>
}

export function buildInstructionParserForTest(): SingleParser<InstructionNode> {
  const genlex = new GenLex()
  const tokens = getInstructionTokens(genlex)
  const grammar = createInstructionGrammar(tokens)
  return genlex.use(grammar)
}

export function buildInstructionParser(): SingleParser<InstructionNode> {
  const genlex = new GenLex()
  const tokens = getInstructionTokens(genlex)
  return genlex.use(createInstructionGrammar(tokens))
}
