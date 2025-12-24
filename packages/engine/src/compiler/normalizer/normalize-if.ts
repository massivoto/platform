import { ArgumentNode, IfNode, InstructionNode } from '../parser/ast.js'

function isIfArg(arg: ArgumentNode | undefined): boolean {
  return (
    !!arg &&
    arg.type === 'argument' &&
    arg.name?.type === 'identifier' &&
    arg.name.value === 'if'
  )
}

/**
 * Check if the instruction has an If argument
 * Not sure if it's useful
 * @param node
 */
export function normalizeIf(node: InstructionNode): InstructionNode | IfNode {
  if (!node.args || node.args.length === 0) return node

  const idx = node.args.findIndex(isIfArg)
  if (idx === -1) return node

  const testExpr = node.args[idx].value
  const newArgs = node.args.toSpliced(idx, 1)

  const instructionWithoutIf: InstructionNode = {
    type: 'instruction',
    command: node.command,
    args: newArgs,
    output: node.output,
  }

  const ifNode: IfNode = {
    type: 'if',
    test: testExpr,
    // consequent is the instruction to execute if test is true
    consequent: instructionWithoutIf,
  }

  return ifNode
}
