# Expression Grammar

This document defines the expression grammar for the OTO DSL.

## TODO

- [ ] Add array primary (deferred)

## Grammar

```grammar
primary        := literal
                | pathLiteral
                | identifier
                | '(' expression ')'

pathLiteral    := globLiteral | fileLiteral
fileLiteral    := '~/' [a-zA-Z0-9_\-./]+          // no *, no ..
globLiteral    := '~/' [a-zA-Z0-9_\-./]* '*' ...  // requires at least one *

member         := primary ('.' IDENT)+               // dot-only; no [expr]

postfix        := member|primary                      // no function calls here

unary          := ('!' | '+' | '-') postfix

multiplicative := chainLeft(postfix|unary,       ('*' | '/' | '%'),  makeBinary)
additive       := chainLeft(multiplicative, ('+' | '-'),     makeBinary)
comparison     := chainLeft(additive,     ('<' | '<=' | '>' | '>='), makeBinary)
equality       := chainLeft(comparison,   ('==' | '!='),     makeBinary)
logicalAnd     := chainLeft(equality,     '&&',              makeLogical)   // left-assoc
logicalOr      := chainLeft(logicalAnd,   '||',              makeLogical)   // left-assoc

// Pipe is value-first, stage separator `|`, arg separator `:`
pipe           := logicalOr ( '|' IDENT ( ':' expression )* )+   → PipeChainNode

// Mapper extracts property from source (v1.5: evaluation support)
mapper         := expression '->' simpleString                    → MapperExpressionNode

expression     := pipe | logicalOr
```

## Braced Expressions

Braces `{expr}` delimit expressions in argument positions. They are required for complex
expressions and optional for simple ones.

```grammar
bracedExpr     := '{' fullExpression '}'

fullExpression := pipe | mapper | bracedExpr | simpleExpression
```

### When Braces Are Required

| Expression Type | Example | Braces Required |
|-----------------|---------|-----------------|
| Identifier | `user` | No |
| Literal | `"hello"`, `42`, `true` | No |
| File path | `~/images/hero.png` | No |
| Glob pattern | `~/images/*.jpg` | No |
| Member access | `user.name` | No |
| Unary | `!active`, `-count` | No |
| Binary (arithmetic) | `a + b` | Recommended* |
| Binary (comparison) | `a > b` | Recommended* |
| Logical | `a && b` | Recommended* |
| Pipe | `data\|filter:active` | Yes |
| Mapper | `users -> name` | Yes (in arg position) |

*Parser currently accepts without braces (permissive mode). May be enforced in v1.5.

### Examples

```oto
// Simple - no braces needed
@utils/log message=greeting
@utils/log message=user.name

// File paths - no braces needed
@ai/describe image=~/images/hero.png output=description
@block/begin forEach=~/images/races/*.jpg -> photo
  @ai/describe image={photo} output=description
@block/end

// Complex - braces recommended
@utils/set input={a + b} output=sum
@flow/if condition={count > 0}

// Pipes - braces required
@utils/log message={data|uppercase}
@ai/generate prompt={items|join:", "}

// Mapper - braces in argument position
@flow/forEach forEach={users -> user}
@utils/set input={users -> name} output=names
```

## Mapper Expression

The mapper operator `->` extracts a property path from a source expression.

```
source -> target
```

- **source**: Any expression (identifier, pipe result, etc.)
- **target**: Property path as simple string (`name`, `profile.email`)

### Semantics (v1.5)

When evaluated:
- If source is an object: returns the property value
- If source is an array: returns array of property values (map operation)

```oto
// Object: extracts single property
user -> name              // user.name

// Array: maps over elements
users -> name             // users.map(u => u.name)

// With pipe
{users|filter:active} -> email
```

### Mapper in Output Position (v1.5)

Mapper can be used with `output=` to extract and assign:

```oto
@utils/set input={users} output=names -> name
// Equivalent to: names = users.map(u => u.name)
```
