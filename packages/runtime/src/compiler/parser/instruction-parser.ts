import { GenLex, IGenLex, leanToken, SingleParser } from '@masala/parser'
import { createArgGrammar } from './arg-parser.js'
import {
  ArgTokens,
  createArgumentTokens,
} from './args-details/tokens/argument-tokens.js'

import { ArgumentNode, CommandNode, IdentifierNode, InstructionNode } from './ast.js'
import { buildCommandParser } from './command/command-parser.js'

export interface InstructionTokens extends ArgTokens {
  COMMAND: SingleParser<CommandNode>
}

function getInstructionTokens(genlex: IGenLex): InstructionTokens {
  // Command parser uses its own GenLex with no separators to reject "@pkg/ name" with internal spaces
  const commandParser = buildCommandParser()

  return {
    ...createArgumentTokens(genlex),
    // Register command as a single token with high priority, unwrap with leanToken (convention)
    COMMAND: genlex.tokenize(commandParser, 'COMMAND', 3000).map(leanToken),
  }
}

export function createInstructionGrammar(
  tokens: InstructionTokens,
): SingleParser<InstructionNode> {
  const arg = createArgGrammar(tokens)
  const { COMMAND } = tokens

  const instruction = COMMAND.then(arg.optrep()).map((t) => {
    const command = t.first()
    const args = t.array().slice(1) as ArgumentNode[]
    const { output, args: argsWithoutOutput } = extractOutputFromArgs(args)

    const instructionNode: InstructionNode = {
      type: 'instruction',
      command,
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
