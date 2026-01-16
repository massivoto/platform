# DSL 0.5 Specification (Implemented)

This document describes what is **actually implemented** in the runtime as of version 0.5.
Based on the parser code, AST definitions, and passing tests.

## Overview

DSL 0.5 is a minimal automation language designed for AI-generated code. The core principle is **NO AMBIGUITY** - every construct has exactly one interpretation.

## Syntax

### Command

```
@package/function arg1=value arg2=value output=result
```

- Commands start with `@`
- Package and function separated by `/`
- Subcommands supported: `@package/sub/function`
- **No spaces inside commands** (enforced by parser)
- Minimum one segment required: `@pkg/cmd` (not `@pkg` alone)

### Arguments

```
key=value
```

- Key is an identifier: `[a-zA-Z_][a-zA-Z0-9_-]*` (cannot end with `-`)
- Value is an expression (see below)
- `output` is a special argument that captures the return value

### Expressions

#### Literals

| Type | Example | AST Node |
|------|---------|----------|
| String | `"hello world"` | `literal-string` |
| Number | `42`, `3.14`, `-5` | `literal-number` |
| Boolean | `true`, `false` | `literal-boolean` |
| Null | `null` | `literal-null` |

#### Identifiers

```
users
data
myVariable
```

- Resolved from `context.data` by default
- Reserved words cannot be identifiers: `true`, `false`, `for`, `forEach`, `for-each`, `in`, `if`, `else`, `endif`, `repeat`, `while`, `function`, `return`, `break`, `continue`, `switch`, `case`, `default`, `let`, `const`, `var`

#### Member Expressions

```
user.name
data.users.0.email
profile.settings.theme
```

- Dot notation only (no computed `obj[expr]`)
- Resolved as nested path access

#### Unary Expressions

```
!isValid
-count
+value
```

Operators: `!`, `-`, `+`

#### Binary Expressions

```
a + b
count * 2
price - discount
total / items
remainder % 10
```

Operators: `+`, `-`, `*`, `/`, `%`

#### Comparison Expressions

```
age >= 18
count < 100
price == 0
status != "error"
```

Operators: `==`, `!=`, `<`, `<=`, `>`, `>=`

#### Logical Expressions

```
isActive && hasPermission
isEmpty || isDefault
```

Operators: `&&`, `||`

#### Pipe Expressions

```
{users:orderBy:followers}
{data:tail:10}
{items:first:5}
{monitors:keys}
{values:filter:isActive}
```

- Wrapped in `{}`
- Colon `:` separates pipe name and arguments
- Pipes chain left-to-right
- Arguments are expressions

## AST Node Types

### InstructionNode

```typescript
interface InstructionNode {
  type: 'instruction'
  command: CommandNode
  args: ArgumentNode[]
  output?: IdentifierNode
}
```

### CommandNode

```typescript
interface CommandNode {
  type: 'command'
  path: string[]      // ['robusta', 'deploy', 'app']
  package: string     // 'robusta'
  name: string        // 'app' (last segment)
}
```

### ExpressionNode

```typescript
type ExpressionNode =
  | IdentifierNode
  | LiteralNode           // string, number, boolean, null
  | MemberExpressionNode  // user.name
  | UnaryExpressionNode   // !x, -x, +x
  | BinaryExpressionNode  // a + b
  | LogicalExpressionNode // a && b
  | PipeExpressionNode    // {x:pipe:arg}
```

## Operator Precedence (highest to lowest)

1. Primary (literals, identifiers, parentheses)
2. Member access (`.`)
3. Unary (`!`, `+`, `-`)
4. Multiplicative (`*`, `/`, `%`)
5. Additive (`+`, `-`)
6. Comparison (`<`, `<=`, `>`, `>=`)
7. Equality (`==`, `!=`)
8. Logical AND (`&&`)
9. Logical OR (`||`)
10. Pipe (`|`)

## What is NOT in 0.5

- Comments (`//`, `/* */`)
- Blocks (`@start/block`, `@end/block`)
- `forEach` inline syntax
- `while` loops
- `if` conditionals (inline)
- Templates (`#package/template`)
- Mapping tokens (`monitors->name`)
- `options` keyword
- String interpolation (`${}`)
- Multiline commands
- Computed properties (`obj[expr]`)
- Conditional expressions (`a ? b : c`)
- Single-quoted strings
- Empty argument shorthand (`displayParent` meaning `displayParent=true`)

## Example

```oto
@llm/generateImage prompt="art for music in a clean room" output=image
@print/users users={users:orderBy:followers:tail:10}
@db/query sql="SELECT * FROM users" output=activeUsers
```
