import { PipeExpressionNode } from './args-details/pipe-parser/pipe-parser.js'

export type LiteralNode =
  | LiteralStringNode
  | LiteralNumberNode
  | LiteralBooleanNode
  | LiteralNullNode

// foo.bar or (foo).bar.baz
// Not supporting computed properties (foo[expr]) for now
export interface MemberExpressionNode {
  type: 'member'
  object: ExpressionNode // (often identifier, sometimes array or parenthesized expr)
  path: string[] // sequence of property names
  computed: false // true for obj[expr], false for obj.prop
}

export interface UnaryExpressionNode {
  type: 'unary'
  operator: '!' | '-' | '+'
  argument: ExpressionNode
}

export interface BinaryExpressionNode {
  type: 'binary'
  operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | '+' | '-' | '*' | '/' | '%'
  left: ExpressionNode
  right: ExpressionNode
}

export interface LogicalExpressionNode {
  type: 'logical'
  operator: '&&' | '||'
  left: ExpressionNode
  right: ExpressionNode
}

export interface ConditionalExpressionNode {
  type: 'conditional'
  test: ExpressionNode
  consequent: ExpressionNode
  alternate: ExpressionNode
}

export interface SingleStringNode {
  type: 'single-string'
  value: string
}

export interface LiteralStringNode {
  type: 'literal-string'
  value: string
}

export interface LiteralNumberNode {
  type: 'literal-number'
  value: number
}

export interface LiteralBooleanNode {
  type: 'literal-boolean'
  value: boolean
}

export interface LiteralNullNode {
  type: 'literal-null'
  value: null
}

/**
 * Unary and binary can be applied on these
 */
export type AtomicNode = IdentifierNode | LiteralNode

export interface IdentifierNode {
  type: 'identifier'
  // TODO : change value to name ?
  value: string
}

export type SimpleExpressionNode =
  | IdentifierNode
  | LiteralNode
  | MemberExpressionNode
  | UnaryExpressionNode
  | BinaryExpressionNode
  | LogicalExpressionNode
  | ConditionalExpressionNode // a ? b : c (optional)

export type ExpressionNode =
  | IdentifierNode
  | LiteralNode
  | MemberExpressionNode
  | UnaryExpressionNode
  | BinaryExpressionNode
  | LogicalExpressionNode
  | ConditionalExpressionNode // a ? b : c (optional)
  | PipeExpressionNode

export interface ArgumentNode {
  type: 'argument'
  name: IdentifierNode
  value: ExpressionNode
}
export interface CommandNode {
  type: 'command'
  // TODO: rename to segments
  path: string[] // robusta/deploy/app -> ['robusta', 'deploy', 'app']
  package: string // @robusta/print -> 'robusta'
  name: string // value of the last segment -> 'app'
}

export interface InstructionNode {
  type: 'instruction'
  command: CommandNode
  args: ArgumentNode[]
  output?: IdentifierNode
}

export type DslAstNode =
  | ProgramNode
  | CommandNode
  | ArgumentNode
  | ExpressionNode

/** TURING COMPLETE STATEMENT: IF, BLOCS */

export type StatementNode = InstructionNode | BlockNode | TemplateNode

export interface BlockNode {
  type: 'block'
  body: StatementNode[]
}

// forEach x of xs { ... }
export interface ForEachNode {
  type: 'forEach'
  iterator: IdentifierNode // e.g. x
  iterable: ExpressionNode // e.g. users
  body: StatementNode
}

interface TemplateNode {
  type: 'template'
  package: string
  name: string
  body: StatementNode[]
}

export interface ProgramNode {
  type: 'program'
  body: StatementNode[]
}

export interface IfNode {
  type: 'if'
  test: ExpressionNode
  // consequent is the instruction to execute if test is true
  consequent: InstructionNode
}
