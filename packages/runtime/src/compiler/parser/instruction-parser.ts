import { GenLex, IGenLex, SingleParser } from '@masala/parser'
import { createArgGrammar } from './arg-parser.js'
import {
  ArgTokens,
  createArgumentTokens,
} from './args-details/tokens/argument-tokens.js'

import { ArgumentNode, IdentifierNode, InstructionNode } from './ast.js'
import { createCommandGrammar } from './command/command-parser.js'
import { CommandTokens, createCommandTokens } from './command/command-tokens.js'

export interface InstructionTokens extends ArgTokens, CommandTokens {}

function getInstructionTokens(genlex: IGenLex): InstructionTokens {
  // TODO: in fact the command should be one of the tokens,
  // and we should create a separated Genlex with no separator to parse the command only

  return {
    ...createCommandTokens(genlex),
    ...createArgumentTokens(genlex),
  }
}

export function createInstructionGrammar(
  tokens: InstructionTokens,
): SingleParser<InstructionNode> {
  const arg = createArgGrammar(tokens)
  const command = createCommandGrammar(tokens)

  const instruction = command.then(arg.optrep()).map((t) => {
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
