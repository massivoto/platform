# Scattered Documentation (Status Unclear)

This file collects documentation scattered across the runtime module.
Status of these features is unclear - they may be partially implemented, planned, or experimental.

---

## Source: `src/compiler/evaluator/documentation.md`

### Evaluator Scope

The evaluator is a **safe expression runtime** - intentionally NOT a general-purpose language:
- No arbitrary function calls
- No JS eval
- Only whitelisted pipes/ops and predictable path resolution

### Supported Expression Families

1. **Value Expressions (Path + Pipes)** - for command arguments and data shaping
   - `{users:orderBy:'followers':tail:10}`
   - `{tweets->id}`
   - `{data.profile.email}`

2. **Boolean Guard Expressions** - only in `if`/`while`
   - Literals, paths
   - `== != < <= > >=`
   - `&& || !`
   - Parentheses

---

## Source: `src/compiler/normalizer/documentation.md`

The normalizer transforms an InstructionNode into IfNode or ForEachNode when it detects `if` or `forEach` arguments.

---

## Source: `src/compiler/normalizer/todo.md`

### Problem: Reserved Words as Arguments

Identifier token is defined as NOT being a keyword:

```typescript
export const identifier = F.regex(/[a-zA-Z_][a-zA-Z0-9_-]*/)
  .filter((s) => s.charAt(s.length - 1) !== '-')
  .filter((s) => !reservedWords.includes(s))
```

`if` and `forEach` are reserved words, so they cannot be parsed as argument names.

**Decision needed:** Declare `output`, `if`, and `forEach` in a separate argument category.

---

## Source: `src/compiler/parser/args-details/expression-grammar.md`

### Expression Grammar (WIP)

```grammar
primary        := literal | identifier | '(' expression ')'
member         := primary ('.' IDENT)+
postfix        := member | primary
unary          := ('!' | '+' | '-') postfix
multiplicative := chainLeft(postfix|unary, ('*' | '/' | '%'), makeBinary)
additive       := chainLeft(multiplicative, ('+' | '-'), makeBinary)
comparison     := chainLeft(additive, ('<' | '<=' | '>' | '>='), makeBinary)
equality       := chainLeft(comparison, ('==' | '!='), makeBinary)
logicalAnd     := chainLeft(equality, '&&', makeLogical)
logicalOr      := chainLeft(logicalAnd, '||', makeLogical)
pipe           := logicalOr ( '|' IDENT ( ':' expression )* )+
expression     := pipe | logicalOr
```

**TODO:** Add array primary (deferred)

---

## Source: `src/compiler/parser/chain-left/chain-left-documentation.md`

### chainLeft Pattern

`chainLeft(term, op, makeNode)` parses left-associative operator chains:

```
term (op term)*  =>  (((a op b) op c) op d)
```

Equivalent to classic grammar:
```
E  -> T E'
E' -> op T E' | ε
```

**Precedence ladder:**
1. primary (literals, identifiers, parenthesized)
2. postfix (calls, member access)
3. unary (`!`, `+`, `-`)
4. multiplicative (`*`, `/`, `%`)
5. additive (`+`, `-`)
6. comparison (`<`, `<=`, `>`, `>=`)
7. equality (`==`, `!=`)
8. logicalAnd (`&&`)
9. logicalOr (`||`)
10. conditional (`?:`) - if added

---

## Source: `src/compiler/parser/args-details/pipe-parser/pipe.md`

### Pipe Expression Specification

**Syntax:** `value | step : arg1 : arg2 ...`

**Reading model:** "take X, then apply Y, then Z..." - data-first, no side-effects.

**Precedence:** Pipe has the **lowest** precedence; everything else binds tighter.

**Execution:** Resolve registered function by name, call as `fn(input, ...args)`, steps apply left-to-right.

### Grammar (EBNF)

```ebnf
expression     ::= pipeExpression | simpleExpression
pipeExpression ::= "{" simpleExpression pipeSegment+ "}"
pipeSegment    ::= "|" pipeName pipeArgs?
pipeArgs       ::= (":" simpleExpression)+
pipeName       ::= identifier
```

### AST Shape

```typescript
interface PipeChainNode {
  kind: 'pipe-chain'
  input: ExpressionNode
  steps: PipeStepNode[]  // non-empty, left-to-right
}

interface PipeStepNode {
  kind: 'pipe-step'
  name: PipeNameNode
  args: ExpressionNode[]
}
```

### Registry-Qualified Names

`pipeName` accepts both:
- Simple identifiers: `print`, `orderBy`
- Registry names: `@ai/generate-image`, `@tweeter/users`

### Disambiguation

- `||` (logical OR) must tokenize **before** single `|`
- Longest-match rule applies

### Out of Scope for v1

- Named arguments (`step: name=expr`)
- Indexing `obj[expr]`
- Function calls outside pipes
- Implicit null propagation

---

## Source: `documentation/todo.md`

### Decision: ArgTokens Return Type

Should ArgTokens return a Node or the Value?

```typescript
export interface UnaryTokens {
  IDENTIFIER: SingleParser<IdentifierNode>  // Node
  NUMBER: SingleParser<LiteralNumberNode>   // Node
  // vs just returning the value?
}
```

**Decision for 0.5:** Keep returning Nodes. Revisit for 0.6.

---

## Open Questions

1. Should `if` and `forEach` be special argument types or reserved keywords?
2. How to handle `forEachKey` equivalent?
3. Mapping token syntax: `monitors->name` vs `{monitors:mappedBy:'name'}`
4. String interpolation escaping rules (`${}` vs `$${}`)
5. ~~Array literals in expressions~~ → PRD created: [array-literals.prd.md](../src/compiler/parser/array-literals.prd.md)
