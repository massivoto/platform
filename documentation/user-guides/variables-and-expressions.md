# Variables and Expressions

The most common confusion for OTO beginners is "is this a string or a variable?". This guide answers it once and for all.

## The bare-vs-braced rule

The right-hand side of any `=` follows one rule:

- **Bare** (no quotes, no braces): treated as a literal string.
- **Quoted**: treated as a literal string.
- **Braced** `{...}`: treated as an expression — variables resolved, operators applied, pipes executed.

```oto
@ai/text prompt=hello              // sends the literal string "hello" as the prompt
@ai/text prompt="hello"            // identical to above
@ai/text prompt={hello}            // sends the VALUE of variable hello
@ai/text prompt="hello {name}"     // string with interpolation: substitutes name's value
```

This is called the **literals-default** rule. Bare = literal. Braces = expression.

If you write `prompt=user` and there is a variable called `user` in scope, you might *expect* it to be substituted. It is not. You wrote the literal string `"user"`. Add braces to interpolate: `prompt={user}`.

## What can go inside `{}`?

Inside braces, any of these is allowed:

| Form | Example | Result |
|------|---------|--------|
| Identifier | `{user}` | Value of `user` from scope |
| Member access | `{user.profile.name}` | Nested property |
| Number | `{42}` | The number 42 (rarely useful inline) |
| Arithmetic | `{count + 1}` | Sum |
| Comparison | `{age >= 18}` | Boolean |
| Logical | `{isActive && hasPermission}` | Boolean |
| Negation | `{!isReady}` | Boolean |
| Pipe chain | `{users \| filter:active \| map:name}` | Transformed value |
| Array literal | `{[1, 2, 3]}` | Array |

Inside a string, `{}` interpolates and concatenates:

```oto
@ai/text prompt="Hello {user.name}, you are {user.age} years old" output=greeting
```

## Variable resolution

When the runtime evaluates a bare identifier inside `{}`, it looks up the name in this order:

1. **Scope chain** — the current block's local scope, then its parent, then grandparent, etc.
2. **`context.data`** — the program-wide variable store
3. **Returns `undefined`** — if the name is found nowhere

`output=name` writes to `context.data` by default. `output=scope.name` writes to the current block scope only.

```oto
@utils/set input=42 output=count             // count is in context.data
@block/begin forEach=users->user
  @utils/set input="local" output=scope.tag  // tag is in block scope
  @utils/log message="{tag} - {count}"        // tag from scope, count from data
@block/end
@utils/log message=tag                        // tag is now undefined — left scope
```

## Namespace prefixes

Some prefixes are read-only access to special parts of the context:

| Prefix | Reads from | Example |
|--------|-----------|---------|
| `scope.` | Current block scope only | `{scope.user}` |
| `data.` | `context.data` (literal — `data.user` reads `context.data.data.user`) | rarely used |
| `env.` | Environment variables (READ-ONLY) | `{env.OPENAI_API_KEY}` |
| `user.` | Current user info | `{user.id}` |
| `cost.` | Execution cost tracking | `{cost.current}` |

You write to `context.data` via `output=name`. You can never write to `env.`, `user.`, or `cost.` from a program — they are injected by the runner.

## Member access

Dot navigation reads nested properties. Computed access (`obj[expr]`) is not in DSL 0.5.

```oto
@utils/set input={user.profile.name} output=displayName
@ai/text prompt="Greet {user.address.city}" output=msg
```

Arrays support numeric segments:

```oto
@utils/log message={users.0.name}     // first user's name
@utils/log message={users.2.email}    // third user's email
```

If any segment is missing, the result is `undefined`.

## Operators and precedence

OTO 0.5 supports these operators inside braces, lowest precedence first:

| Level | Operators | Example |
|-------|-----------|---------|
| Logical OR | `\|\|` | `{a \|\| b}` |
| Logical AND | `&&` | `{a && b}` |
| Equality | `==`, `!=` | `{x == 0}` |
| Comparison | `<`, `<=`, `>`, `>=` | `{age >= 18}` |
| Additive | `+`, `-` | `{count + 1}` |
| Multiplicative | `*`, `/`, `%` | `{price * 0.9}` |
| Unary | `!`, `+`, `-` | `{!found}`, `{-balance}` |
| Member | `.` | `{user.id}` |

`+` is numeric only. To concatenate strings, use string interpolation: `"Hello {name}"`.

## Quoted strings

Use double quotes for normal strings. Backslash escapes `\"`, `\\`, `\n`, `\t` are supported.

```oto
@utils/log message="She said \"hi\""
@file/save data="line one\nline two" file=~/out.txt
```

Single-quoted strings are not in DSL 0.5 (planned for a future version, see the `quotes` done feature).

## The four roles of a bare identifier

A name can play one of four roles depending on syntactic position:

| Role | Position | Meaning | Ambiguous? |
|------|----------|---------|------------|
| Parameter name | Left of `=` | Static argument key | No |
| Value | Right of `=` (regular arg) | Literal string (or variable, if braced) | Yes — solved by braces |
| Binding target | After `output=`, `collect=`, right of `->` | Name to write into scope | No |
| Binding source | After `forEach=...->`, `if=` | Name to read from scope | No |

This is why `output=result` does not need braces — the position alone tells the parser "this is a name to write to". And why `forEach=users->user` reads `users` from scope without braces — the `forEach=` position fixes the role.

If you ever see a bare identifier that you expected to interpolate, check whether you are in a "value position" inside a regular arg. If so, add braces.

## References

- **DSL specification:** [`../dsl-specification/dsl-0.5.md`](../dsl-specification/dsl-0.5.md) — section "Expressions"
- **Identifier roles (deep dive):** [`../dsl-specification/identifier-roles.md`](../dsl-specification/identifier-roles.md) — formal four-role taxonomy
- **Other guides:**
  - [pipes.md](./pipes.md) for the `|` operator inside `{}`
  - [iteration.md](./iteration.md) for `forEach=src->target` and how `target` is bound
  - [system-variables.md](./system-variables.md) for `$index` etc., a separate identifier kind
- **Source code:**
  - `massivoto-interpreter/src/evaluator/evaluators.ts` — expression evaluator
  - `massivoto-interpreter/src/evaluator/scope-chain.ts` — scope lookup
- **Done feature PRDs:**
  - [`features/_done/identifier-roles/step3-literals-default.done.prd.md`](../../../features/_done/identifier-roles/step3-literals-default.done.prd.md) — the rule "bare = literal"
  - [`features/_done/identifier-roles/step4-pipes-outside-braces.done.prd.md`](../../../features/_done/identifier-roles/step4-pipes-outside-braces.done.prd.md)
  - [`features/_done/quotes/quotes.done.prd.md`](../../../features/_done/quotes/quotes.done.prd.md) — escape sequence handling
