# Identifier Roles in OTO

**Date:** 2026-04-09
**Status:** Design foundation
**Scope:** Parser AST, Evaluator, future Type System and LSP

---

## Overview

In the OTO language, a bare identifier (an unquoted word like `users`, `result`, `condition`)
can play four distinct semantic roles depending on its **syntactic position**. Understanding
these roles is critical for:

- Correct parser AST design (each role needs a distinct node type)
- The "Angular String" problem (only one role is ambiguous)
- Future type checking (each role has different type constraints)
- LSP tooling (go-to-definition, autocomplete, rename all depend on knowing what role an identifier plays)

---

## The Four Roles

### Role 1: Parameter Name

The left side of `=` in an argument. Always a static key. Never evaluated, never ambiguous.

```oto
@ai/text prompt=hello model=gemini output=result
         ^^^^^^ ^^^^^             ^^^^^^
```

**AST:** Already handled by `argNode.name` as a plain string. Not a separate node type.

**In programming language theory:** This is a **keyword argument label**. It names the parameter,
not a value. Equivalent to `f(prompt: value)` in Python/Swift.

**Not affected by Angular String problem.** The parser already treats this as static.

---

### Role 2: Value Expression

The right side of `=` in a **regular** argument. This is the Angular String problem.

```oto
@ai/text prompt=bgErasor
                ^^^^^^^^
```

Is `bgErasor` the literal string `"bgErasor"` or a variable reference to resolve from scope?

**Decision (literals-default):** Bare identifiers in value position are **literal strings**.
Variables require braces: `prompt={bgErasor}`.

**AST nodes:**
- `BareStringNode` (type: `'bare-string'`): literal string, no evaluation
- `IdentifierNode` (type: `'identifier'`): variable reference, only inside `{}`

**In programming language theory:** This is the **denotation** problem. The same syntactic
form can denote either a value (literal) or a reference to a binding in the environment.
The Angular String fix resolves the ambiguity by making bare = literal, braces = reference.

---

### Role 3: Binding Target (L-value)

A name that designates **where to write** in the scope. Introduces a new binding
in the environment.

```oto
output=result           // "result" = name of scope slot to WRITE the command output
collect=items           // "items" = name of scope slot to WRITE collected values
forEach=users -> user   // "user" = name of scope slot to WRITE each iteration value
                 ^^^^
```

**In programming language theory:** This is a **variable declaration** or **binding introduction**.
It is the `x` in `let x = ...` (JavaScript), or the bound variable in `lambda x. body`
(lambda calculus). The name itself is never evaluated -- it is used as-is to create an
entry in the scope/environment.

- **L-value** in C/C++ terminology: an expression designating a memory location (writable)
- **Binder** in lambda calculus: the variable introduced by an abstraction
- **Pattern variable** in ML/Haskell: the name introduced in a pattern match

**Not affected by Angular String problem.** The syntactic position (`output=`, `collect=`,
right of `->`) makes the role unambiguous. A bare identifier here is always a name, never
a literal or a variable reference.

**AST node:** `BindingNode` (type: `'binding'`). Fields: `name: string`.

---

### Role 4: Binding Source (R-value)

A name that designates **where to read** from the scope. References an existing binding
in the environment.

```oto
forEach=users -> user   // "users" = name of scope slot to READ the iterable
        ^^^^^
if=condition            // "condition" = name of scope slot to READ and test
   ^^^^^^^^^
```

Can include **path navigation** (member access):

```oto
forEach=data.users -> user   // "data.users" = read "data" from scope, access "users" property
```

**In programming language theory:** This is a **variable reference** or **dereference**.
It is the `x` in the body of `lambda x. x + 1` -- it reads the value bound to that name
in the current environment.

- **R-value** in C/C++ terminology: an expression that produces a value (readable)
- **Free variable** (or bound variable reference) in lambda calculus
- **Name lookup** in scope chain: traverse the environment chain to find the binding

With path navigation (`data.users`), this becomes a **member expression** or **field access**:
first resolve the root name from scope, then navigate the property chain.

**Not affected by Angular String problem.** The syntactic position (`forEach=...->`,
`if=`) makes the role unambiguous. A bare identifier here is always a reference to the scope.

**AST node:** `ReferenceNode` (type: `'reference'`). Fields: `path: string[]`.
Simple case: `path: ['users']`. With navigation: `path: ['data', 'users']`.

---

## Summary Table

| Role | Position | Semantics | Ambiguous? | AST Node | PL Theory Term |
|------|----------|-----------|------------|----------|----------------|
| **Parameter name** | Left of `=` | Static key | No | `argNode.name` (string) | Keyword label |
| **Value** | Right of `=` (regular arg) | Literal or variable | **Yes** (Angular String) | `BareStringNode` or `IdentifierNode` | Denotation |
| **Binding target** | `output=`, `collect=`, right of `->` | Name to WRITE in scope | No | `BindingNode` | Variable declaration / L-value |
| **Binding source** | `forEach=...->`, `if=` | Name to READ from scope | No | `ReferenceNode` | Variable reference / R-value |

---

## Impact on AST Design

### Current state (incomplete)

| Role | Current AST type | Problem |
|------|-----------------|---------|
| Parameter name | `argNode.name: string` | OK -- not a node, just a string |
| Value (literal) | `BareStringNode` | OK (after Angular String fix) |
| Value (variable) | `IdentifierNode` (inside `{}`) | OK |
| Binding target | `IdentifierNode` or `BareStringNode` | Wrong -- neither captures "scope write slot" |
| Binding source | `BareStringNode` (after step 2) | Wrong -- a BareString is a literal, not a scope reference |

### Target state

Each role should have a dedicated AST node type so that:
- The parser communicates **intent** to the evaluator/interpreter
- The type checker knows what constraints apply (binding target must be a valid name, binding source must exist in scope)
- LSP can provide go-to-definition for references, and find-all-references for bindings

### Target state

Each role should have a dedicated AST node type so that:
- The parser communicates **intent** to the evaluator/interpreter
- The type checker knows what constraints apply (binding target must be a valid name, binding source must exist in scope)
- LSP can provide go-to-definition for binding references, and find-all-references for binding targets

| Role | AST Node | Type string | Fields |
|------|----------|-------------|--------|
| Value (literal) | `BareStringNode` | `'bare-string'` | `value: string` |
| Value (variable) | `IdentifierNode` | `'identifier'` | `value: string` |
| Binding target | `BindingNode` | `'binding'` | `name: string` |
| Binding source | `ReferenceNode` | `'reference'` | `path: string[]` |

---

## Interaction with the Mapper

The mapper operator `->` involves exactly one binding source (left) and one binding target (right):

```
forEach=users -> user
        ^^^^^    ^^^^
        ReferenceNode  BindingNode
        path: ['users']  name: 'user'
```

With path navigation:

```
forEach=data.users -> user
        ^^^^^^^^^^    ^^^^
        ReferenceNode       BindingNode
        path: ['data',      name: 'user'
               'users']
```

The mapper AST becomes:

```typescript
interface MapperNode {
  type: 'mapper'
  source: ReferenceNode    // where to READ (scope lookup, with optional path)
  target: BindingNode      // where to WRITE (name introduced in scope)
}
```

The mapper does NOT need `ExpressionNode` for the source. It needs a `ReferenceNode`
that can include path navigation. Complex expressions like `{users|filter:active}`
are not binding references -- they are value expressions and belong in a `@utils/set` step
before the forEach.

---

## Interaction with Angular String Problem

The Angular String problem ONLY affects **Role 2 (Value)**. The other three roles are
determined by syntactic position and are never ambiguous:

- Role 1 (parameter name): always static, handled by parser structure
- Role 3 (binding target): position after `output=`, `collect=`, or right of `->` is unambiguous
- Role 4 (binding source): position after `forEach=...->` or `if=` is unambiguous

This means the literals-default change (Step 3) does not affect how `output=result`,
`forEach=users -> user`, or `if=condition` work. These reserved args are in binding
positions, not value positions.

---

## Future: Type System and LSP

### Type checking

- Binding targets: the type checker verifies the name is a valid identifier and warns on shadowing
- Binding sources: the type checker verifies the name exists in scope and has the expected type
  (e.g., `forEach=` source must be iterable)
- Values: the type checker matches the literal or expression type against the command's parameter type

### LSP

- **Go-to-definition** on a binding source navigates to the binding target that introduced it
- **Find all references** on a binding target shows all binding sources that read from it
- **Rename** on a binding target updates all binding sources
- **Autocomplete** in binding source position suggests names from scope
- **Autocomplete** in value position suggests literals (from command schema) or `{` to start an expression

### Syntax highlighting

- Binding targets: one color (e.g., declaration blue)
- Binding sources: another color (e.g., reference teal)
- Bare string values: plain text color
- Braced expressions: expression color

---

## References

- `features/angular-string/angular-string.idea.md` -- the Angular String problem and decision
- `massivoto-interpreter/src/parser/ast.ts` -- current AST node types
- `massivoto-interpreter/src/parser/instruction-parser.ts` -- reserved arg parsing
- `massivoto-interpreter/src/parser/args-details/mapper-parser.ts` -- mapper `->` parsing
- Lambda calculus: Church, A. (1936) -- binding and variable reference
- L-values and R-values: Strachey, C. (1967) "Fundamental Concepts in Programming Languages"
- Environments and scope chains: Abelson & Sussman, "Structure and Interpretation of Computer Programs"
