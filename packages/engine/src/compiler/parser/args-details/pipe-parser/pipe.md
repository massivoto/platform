Multiple pipes chain left-to-right; the left operand is passed to the pipe;
parameters follow with :. Docs also clarify operator precedence (pipe is lower
than + - \* / && || and higher than ?:).


## Diff Angular 17+ and AngularJS

Syntax is basically the same

AngularJS: Register a filter function; also accessible via $filter('name').
docs.angularjs.org

Angular 17+: Decorate a class with @Pipe({name}) and a transform() method. Pipes
are first-class in the template system (and can be standalone, no NgModule
required). Built-ins include date, currency, async, etc


## Prompt result


# PipeExpression & PipeChainNode — crisp spec (v1)

## 1) Scope & goals

* **Reading model**: “take X, then apply Y, then Z…” with **data-first** syntax and **no side-effects**.
* **Surface**: `value | step : arg1 : arg2 ...`
* **Arguments**: each `arg` is a full **expression** (same grammar as non-pipe expressions).
* **Precedence**: the pipe has the **lowest** precedence; everything else binds tighter.
* **Execution**: resolve a **registered function** by name and call it as `fn(input, ...args)`; steps apply **left→right**.

---

## 2) Surface grammar (EBNF)

```ebnf
expression     ::= pipeExpression | simpleExpression

pipeExpression ::= "{" simpleExpression pipeSegment+ "}"         (* at least one step *)

pipeSegment    ::=  "|"  pipeName  pipeArgs?
pipeArgs       ::= ( ":"  simpleExpression  )+   

pipeName       ::= identifier

simpleExpression ::= logicalOr

(* Existing precedence ladder kept as-is; pipeExpression sits ‘on top’ *)
logicalOr      ::= chainLeft(logicalAnd, "||", makeLogical)
logicalAnd     ::= chainLeft(equality, "&&",  makeLogical)
equality       ::= chainLeft(comparison, ("==" | "!="), makeBinary)
comparison     ::= chainLeft(additive,   ("<" | "<=" | ">" | ">="), makeBinary)
additive       ::= chainLeft(multiplicative, ("+" | "-"), makeBinary)
multiplicative ::= chainLeft(unary, ("*" | "/" | "%"), makeBinary)
unary          ::= ( "!" | "+" | "-" ) postfix
postfix        ::= member | primary
member         ::= primary ( "." identifier )*
primary        ::= literal
                 | identifier
                 | "(" expression ")"
                 // NOT SUPPORTED: | "{" simpleExpression pipeSegment+ "}" // to use member/array on pipes { user | fullName }.length 


```

### Notes

* `pipeName` accepts both simple identifiers (`print`) **and** registry-qualified names (`@ai/generate-image`, `@tweeter/users`). Hyphens are allowed **only** in registry names.
* `||` (logical OR) must be tokenized **before** single `|` (longest-match rule) to avoid ambiguity.
* Whitespace (including newlines) is allowed around `|` and `:`.

---

## 3) Tokens & lexing

* **Operators**: `||`, `&&`, `|`, `:`, `==`, `!=`, `<=`, `>=`, `<`, `>`, `+`, `-`, `*`, `/`, `%`, `!`, `.`.
* **Names**:

    * `IDENT`: `[A-Za-z_][A-Za-z0-9_]*`
    * `IDENT_OR_DASH`: `[A-Za-z_][A-Za-z0-9_-]*` (for `nsSegment` inside registry names)
* **Disambiguation**:

    * Recognize `||` **before** `|`.
    * Recognize `==`, `!=`, `<=`, `>=` **before** single char comparators.

---

## 4) AST shape

```ts
interface BaseNode { kind: string; span?: { start: number; end: number } }

interface IdentifierNode extends BaseNode {
  kind: 'identifier';
  name: string;                // e.g., "users"
}

interface QualifiedNameNode extends BaseNode {
  kind: 'qualified-name';
  registry: string;            // e.g., "ai" | "tweeter"
  name: string;                // e.g., "generate-image" | "users"
  raw: string;                 // e.g., "@ai/generate-image"
}

type PipeNameNode = IdentifierNode | QualifiedNameNode;

interface PipeStepNode extends BaseNode {
  kind: 'pipe-step';
  name: PipeNameNode;          // step name (simple or registry-qualified)
  args: ExpressionNode[];      // zero or more
}

interface PipeChainNode extends BaseNode {
  kind: 'pipe-chain';
  input: ExpressionNode;       // the leftmost value
  steps: PipeStepNode[];       // non-empty, applied left→right
}
```

**Invariants**

* `steps.length >= 1`.
* `args[i]` is any valid `ExpressionNode` (including nested pipe only if parenthesized per precedence).
* `input.kind !== 'pipe-chain'` by construction (the grammar lifts logicalOr before pipe).

---

## 5) Parsing rules (combinator view)

Pseudocode using combinators (names illustrative):

```ts
function pipeExpression(): SingleParser<ExpressionNode> {
  return logicalOr().then(
    pipeSegment().rep1() // one or more
  ).map(([input, segments]) => ({
      kind: 'pipe-chain',
      input,
      steps: segments
  }))
  .or(logicalOr()); // fallback if no segments
}

function pipeSegment(): SingleParser<PipeStepNode> {
  return token('|').drop()
    .then(pipeName())
    .then( token(':').drop().then(expression()).rep() ) // zero or more args
    .array()
    .map(([name, args]) => ({ kind: 'pipe-step', name, args }));
}

function pipeName(): SingleParser<PipeNameNode> {
  return qualifiedName().or(identifier());
}
```

---

## 6) Precedence & associativity

* **Associativity**: pipelines evaluate **left→right**:
  `a | f:x | g:y:z` ≡ `g(f(a, x), y, z)`.
* **Precedence**: `pipeExpression` has the **lowest** precedence; thus:

    * `a + b | f:c` ≡ `(a + b) | f:c`
    * `a | f : b + c` ≡ `a | f : (b + c)`
    * Use parentheses to override: `(a | f) || g` vs `a | (f || g)` (the latter is **invalid** because step names are not expressions).

---

## 7) Execution semantics

### Lookup & calling

* Each `PipeStepNode.name` resolves in a **registry** (immutable mapping).

    * `IdentifierNode("foo")` → registry entry `"foo"`.
    * `QualifiedNameNode("@ns/name")` → registry namespace `ns`, entry `name`.
* Resolved value **must** be a pure function with signature:

  ```ts
  type StepFn = (input: any, ...args: any[]) => any | Promise<any>;
  ```
* The evaluator composes steps as:

  ```ts
  let acc = evalExpr(node.input, env);
  for (const step of node.steps) {
    const fn  = registry.resolve(step.name);
    const ars = step.args.map(a => evalExpr(a, env));
    acc = await fn(await acc, ...(await Promise.all(ars)));
  }
  return acc;
  ```
* **Purity**: functions must be referentially transparent (no I/O / global mutation). Engines may **enforce** this by sandboxing/allowlisting.

### Error behavior at runtime

* Missing function → `E_PIPE_UNKNOWN_STEP`.
* Non-callable value → `E_PIPE_NOT_FUNCTION`.
* Arity/type issues are **validation** concerns (see §8); at runtime they’re thrown as `E_PIPE_BAD_ARGS` if not caught earlier.

---

## 8) Static validation (post-parse pass)

Given a registry with metadata:

```ts
interface StepMeta {
  name: string; namespace?: string;
  minArgs: number; maxArgs?: number;                 // variadic if maxArgs = undefined
  type?: (inputTy: Type, argTys: Type[]) => Type;    // optional type resolver
}
```

Rules:

1. **Existence**: every `step.name` must match a registry entry.
2. **Arity**: `minArgs ≤ step.args.length ≤ maxArgs?`.
3. **Types (optional)**: if a type system is present, infer/check `input` and `args` flow across steps.
4. **Purity flag**: reject steps marked impure in “pure expression” contexts.

Violations are attached to nodes with precise `span` for IDEs/diagnostics.

---

## 9) Normalization / Desugaring

For downstream execution / optimization, a `PipeChainNode` can be rewritten to canonical **apply** calls:

```ts
// Before
{ kind: 'pipe-chain',
  input: X,
  steps: [ {name:F, args:[A]}, {name:G, args:[B,C]} ] }

// After (left fold)
Apply( G, [ Apply(F, [X, A]), B, C ] )

// Where:
interface ApplyNode extends BaseNode {
  kind: 'apply';
  callee: PipeNameNode;           // registry-bound
  args: ExpressionNode[];         // already ordered with input as first
}
```

This “canonical form” simplifies:

* cost-based optimization (e.g., fusion, dead-step elimination when `Apply(id, [x]) → x`),
* caching/memoization,
* test golden-files.

---

## 10) Diagnostics & errors (parse-time)

* `E_PIPE_TRAILING_BAR` — found `… |` at end of expression.
* `E_PIPE_EXPECTED_NAME` — after `|`, no valid `pipeName`.
* `E_PIPE_BAD_NAME` — syntactically invalid registry name (e.g., `@/foo`, `@ns/`).
* `E_PIPE_MISSING_ARG` — `:` not followed by an expression.
* `E_PIPE_CONFLICT_WITH_LOGICAL_OR` — accidental `||` split; lexer must treat `||` atomically; if `|` seen where `||` expected, hint probable typo.

Each error should:

* highlight the offending span,
* suggest a fix (e.g., “Did you mean `||`?” / “Remove trailing `:` / add an expression”).

---

## 11) Formatting rules

* **Spaces**: formatter inserts `space` around `|` and after `:` when the next token is not `(`:

    * `a|f:1:(b+c)` → `a | f: 1 : (b + c)` (configurable).
* **Multi-line** (long pipelines):

  ```txt
  input
    | step1: arg1 : arg2
    | @ns/step2
    | step3: (complex + expression)
  ```

  Indent `|` columns, keep steps on their own lines.

---

## 12) Examples

### Minimal

```
42 | double
```

AST (abridged):

```json
{
  "kind": "pipe-chain",
  "input": { "kind": "literal", "value": 42 },
  "steps": [{ "kind": "pipe-step", "name": { "kind": "identifier", "name": "double" }, "args": [] }]
}
```

Desugars to: `Apply(double, [42])`.

### With args and registry

```
image
  | @ai/generate-image : "art for music in a clean room"
  | annotate : "cover"
```

Desugars to:

```
Apply(annotate, [ Apply(@ai/generate-image, [image, "art for music in a clean room"]), "cover" ])
```

### Precedence

```
a + b | sum : 10      // = sum( (a + b), 10 )
a | sum : b + 10      // = sum( a, (b + 10) )
(a | sum : b) || c    // pipe result OR c
```

### Errors

```
x |            // E_PIPE_TRAILING_BAR
x | @foo/      // E_PIPE_BAD_NAME
x | step:      // E_PIPE_MISSING_ARG
```

---

## 13) Implementation notes (Masala-friendly)

* **Longest-match** tokenizer to emit `'||'` before `'|'`.
* Parser layering:

    * Keep your primary→unary→… ladder unchanged.
    * Add `pipeExpression` **on top**: `expression := pipeExpression | logicalOr`.
* Use `rep1()` for “one or more” pipe segments.
* Preserve `span` on tokens to feed helpful diagnostics later.
* Keep pipe steps **non-call**: no parentheses after names; only `:` args.

---

## 14) Out-of-scope for v1 (explicitly)

* Named arguments syntax (`step: name = expr`) — model as object literal: `step: { name: expr }`.
* Indexing `obj[expr]` — still disallowed (dot-only members).
* Function calls outside pipes — still disallowed (`foo(bar)` not part of the grammar).
* Implicit null propagation — not in v1; functions must handle `null/undefined` explicitly.

---

## 15) Ready-to-test checklist

* [ ] Parses left→right chains with 0..n args per step.
* [ ] `||` vs `|` disambiguation confirmed.
* [ ] Parenthesized expressions inside args work.
* [ ] Registry-qualified names accepted (`@ns/name-with-dash`).
* [ ] Errors produced with correct spans and messages.
* [ ] Desugaring produces canonical `Apply` tree.
* [ ] Evaluator composes sync/async steps deterministically (await per step).

If you want, I can draft the TypeScript types and a tiny parser skeleton wired to your existing combinator layers next.
