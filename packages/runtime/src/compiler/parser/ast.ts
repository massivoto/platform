import { PipeExpressionNode } from './args-details/pipe-parser/pipe-parser.js'

/**
 * MapperExpressionNode represents the `->` operator for property extraction and iterator binding.
 *
 * Examples:
 * - Property extraction: `users -> name` extracts `name` from each element
 * - Iterator binding: `forEach=users -> user` binds `user` as loop variable
 *
 * The mapper has the LOWEST precedence in the expression hierarchy (below pipe).
 */
export interface MapperExpressionNode {
  type: 'mapper'
  source: ExpressionNode // left side of ->
  target: SingleStringNode // right side of ->
}

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

/*export interface ConditionalExpressionNode {
  type: 'conditional'
  test: ExpressionNode
  consequent: ExpressionNode
  alternate: ExpressionNode
}*/

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

export interface ArrayLiteralNode {
  type: 'array-literal'
  elements: ExpressionNode[]
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
  | ArrayLiteralNode
  | MemberExpressionNode
  | UnaryExpressionNode
  | BinaryExpressionNode
  | LogicalExpressionNode
//| ConditionalExpressionNode // a ? b : c (optional)

export type ExpressionNode =
  | IdentifierNode
  | LiteralNode
  | ArrayLiteralNode
  | MemberExpressionNode
  | UnaryExpressionNode
  | BinaryExpressionNode
  | LogicalExpressionNode
  //| ConditionalExpressionNode // a ? b : c (optional)
  | PipeExpressionNode
  | MapperExpressionNode

export interface ArgumentNode {
  type: 'argument'
  name: IdentifierNode
  value: ExpressionNode
}

/**
 * Reserved argument: output=identifier
 * Stores the result of an instruction in a variable.
 */
export interface OutputArgNode {
  type: 'output-arg'
  target: IdentifierNode
}

/**
 * Reserved argument: if=expression
 * Conditionally executes the instruction based on the expression.
 */
export interface IfArgNode {
  type: 'if-arg'
  condition: ExpressionNode
}

/**
 * Reserved argument: forEach=iterable -> iterator
 * Iterates over a collection, binding each element to the iterator variable.
 *
 * @example
 * forEach=users -> user
 * forEach={users|filter:active} -> user
 * forEach=[1, 2, 3] -> num
 */
export interface ForEachArgNode {
  type: 'forEach-arg'
  iterable: ExpressionNode // left side of mapper (users, data.users, {users|filter})
  iterator: SingleStringNode // right side of mapper (user) - variable name
}

/**
 * Union of all reserved argument types.
 */
export type ReservedArgNode = OutputArgNode | IfArgNode | ForEachArgNode

/**
 * ActionNode represents the @package/name identifier in OTO source.
 * This is the "what" - which action to perform.
 * The actual execution is handled by Command (JS handler) in the handlers layer.
 */
export interface ActionNode {
  type: 'action'
  // TODO: rename to segments
  path: string[] // robusta/deploy/app -> ['robusta', 'deploy', 'app']
  package: string // @robusta/print -> 'robusta'
  name: string // value of the last segment -> 'app'
}

/**
 * InstructionNode is a complete executable unit: action + arguments + reserved args.
 * A Program is a sequence of Instructions.
 */
export interface InstructionNode {
  type: 'instruction'
  action: ActionNode
  args: ArgumentNode[]
  output?: IdentifierNode // from output=identifier
  condition?: ExpressionNode // from if=expression
  forEach?: ForEachArgNode // from forEach=iterable -> iterator (used by @block/begin)
}

export type DslAstNode =
  | ProgramNode
  | ActionNode
  | ArgumentNode
  | ExpressionNode

/** TURING COMPLETE STATEMENT: IF, BLOCS */

export type StatementNode = InstructionNode | BlockNode | TemplateNode

export interface BlockNode {
  type: 'block'
  name?: string // from name="label" argument on @block/begin
  condition?: ExpressionNode // from if=expression argument on @block/begin
  forEach?: ForEachArgNode // from forEach=iterable -> iterator argument on @block/begin
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
