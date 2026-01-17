import { IfNode, InstructionNode } from '../parser/ast.js'

/**
 * Transform an instruction with if=condition into an IfNode.
 * The condition is now parsed directly by the instruction parser
 * and stored in node.condition (no arg searching needed).
 */
export function normalizeIf(node: InstructionNode): InstructionNode | IfNode {
  // No condition = return unchanged
  if (!node.condition) return node

  // Create instruction without condition for the consequent
  const instructionWithoutCondition: InstructionNode = {
    type: 'instruction',
    action: node.action,
    args: node.args,
    output: node.output,
    // condition is intentionally omitted
  }

  const ifNode: IfNode = {
    type: 'if',
    test: node.condition,
    consequent: instructionWithoutCondition,
  }

  return ifNode
}
