import { GenLex, IGenLex, leanToken, SingleParser } from '@masala/parser'
import { createArgGrammar } from './arg-parser.js'
import {
  ArgTokens,
  createArgumentTokens,
} from './args-details/tokens/argument-tokens.js'

import { ArgumentNode, ActionNode, IdentifierNode, InstructionNode } from './ast.js'
import { buildActionParser } from './action/action-parser.js'

export interface InstructionTokens extends ArgTokens {
  ACTION: SingleParser<ActionNode>
}

function getInstructionTokens(genlex: IGenLex): InstructionTokens {
  // Action parser uses its own GenLex with no separators to reject "@pkg/ name" with internal spaces
  const actionParser = buildActionParser()

  return {
    ...createArgumentTokens(genlex),
    // Register action as a single token with high priority, unwrap with leanToken (convention)
    ACTION: genlex.tokenize(actionParser, 'ACTION', 3000).map(leanToken),
  }
}

export function createInstructionGrammar(
  tokens: InstructionTokens,
): SingleParser<InstructionNode> {
  const arg = createArgGrammar(tokens)
  const { ACTION } = tokens

  const instruction = ACTION.then(arg.optrep()).map((t) => {
    const action = t.first()
    const args = t.array().slice(1) as ArgumentNode[]
    const { output, args: argsWithoutOutput } = extractOutputFromArgs(args)

    const instructionNode: InstructionNode = {
      type: 'instruction',
      action,
      args: argsWithoutOutput,
      output,
    }
    return instructionNode
  })
  return instruction as SingleParser<InstructionNode>
}

function extractOutputFromArgs(args: ArgumentNode[]): {
  output: IdentifierNode | undefined
  args: ArgumentNode[]
} {
  const outputArg = args.find((arg) => arg.name.value === 'output')
  if (outputArg) {
    const output = outputArg as ArgumentNode
    const argsWithoutOutput = args.filter((arg) => arg.name.value !== 'output')
    if (output.value.type === 'identifier') {
      return {
        output: { type: 'identifier', value: output.value.value },
        args: argsWithoutOutput,
      }
    }
  }
  return {
    output: undefined,
    args: args,
  }
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
