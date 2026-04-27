# Conditions

`if=` lets a command run only when a condition is truthy. It is the simplest form of branching in OTO.

## Standalone guard

```oto
@email/send to=user.email if={user.subscribed}
```

If `user.subscribed` is truthy, the email is sent. If falsy, the command is skipped — no error, no log entry beyond a "skipped" marker.

`if=` is a reserved arg, so it works on any command.

## What counts as truthy

OTO uses JavaScript truthiness:

| Value | Truthy? |
|-------|---------|
| `true` | yes |
| `false` | no |
| Non-zero number | yes |
| `0` | no |
| Non-empty string | yes |
| `""` | no |
| Non-empty array | yes |
| `[]` | yes (a non-null reference) |
| Object | yes |
| `null`, `undefined` | no |

The empty-array case is a common gotcha. `if={items}` is true even when `items` is empty. Use `if={items | length > 0}` for an explicit check.

## Comparison operators

```oto
@deploy/launch if={env.NODE_ENV == "production"}
@db/cleanup if={user.lastLogin < cutoff}
@alert/send if={errorCount >= threshold}
```

| Operator | Meaning |
|----------|---------|
| `==` | Equal |
| `!=` | Not equal |
| `<`, `<=` | Less than (or equal) |
| `>`, `>=` | Greater than (or equal) |

In DSL 0.5, `==` is strict-ish equality (no automatic string-to-number coercion). Comparing different types returns false rather than coercing.

## Logical operators

```oto
@email/send if={user.subscribed && !user.bounced}
@alert/send if={priority == "high" || priority == "critical"}
```

`&&` and `||` short-circuit, so side effects on the right are not evaluated when the left already determines the outcome.

`!` negates:

```oto
@cleanup/run if={!user.active}
```

## Combining with `forEach`

`if=` runs once per iteration, after the iterator is bound:

```oto
@ai/translate text={article.body} forEach=articles->article if={article.published} collect=translations
```

Order of operations:

1. Bind `article` to the next item.
2. Evaluate `if={article.published}`.
3. If false: skip and continue.
4. If true: run `@ai/translate`, retry on failure, collect.

`if=` *cannot* see the next iterator before it is bound. If you need cross-iteration logic, use `@utils/set` to derive a precomputed flag.

## Combining with `output`

The skipped command writes nothing — `output=name` does not get assigned. If you need a default value:

```oto
@utils/set input="N/A" output=greeting
@ai/text prompt="Greet {user.name}" if={user.subscribed} output=greeting
```

The first line establishes a default. The second overwrites it only when the condition holds.

## Pipes inside `if=`

A pipe expression is a regular expression and works in `if=`:

```oto
@batch/process if={items | filter:active | length > 0}
```

This skips the command when the filtered list is empty.

## Nested expressions

Parentheses group:

```oto
@deploy/run if={(env.STAGE == "prod" || env.STAGE == "stage") && !env.MAINTENANCE_MODE}
```

The grammar is well-defined — see [variables-and-expressions.md](./variables-and-expressions.md) for the full precedence table.

## What `if=` does **not** do

`if=` is not a multi-branch construct. There is no `else if`, no `switch`. To express "do A or B":

```oto
@core/log message="A path" if={cond}
@core/log message="B path" if={!cond}
```

Or use `@flow/goto` with `label=` for non-trivial branching (covered in a future intermediate guide).

## Pitfalls

**Forgetting braces.** `if=user.active` evaluates the *string* `"user.active"`, which is truthy (non-empty), so the command always runs. Always use `if={user.active}`.

**String comparisons.** `if={status == active}` compares against the literal string `"active"` (bare = literal — correct here). But `if={status == "active"}` is the same and clearer. Use quotes for string literals to avoid ambiguity.

**Counting an empty array.** `if={items}` is truthy even for `[]`. Use `if={items | length > 0}`.

## References

- **Other guides:**
  - [variables-and-expressions.md](./variables-and-expressions.md) — operator precedence, the bare-vs-braced rule
  - [iteration.md](./iteration.md) — `if=` inside `forEach`
  - [pipes.md](./pipes.md) — `length`, `filter` for non-trivial conditions
- **DSL specification:** [`../dsl-specification/dsl-0.5.md`](../dsl-specification/dsl-0.5.md) — section "Operators"
- **Source code:**
  - `massivoto-interpreter/src/core-interpreter.ts` — `if=` evaluation in instruction execution
  - `massivoto-interpreter/src/evaluator/evaluators.ts` — comparison and logical evaluation
- **Architecture:** [`../../../massivoto-interpreter/src/interpreter.archi.md`](../../../massivoto-interpreter/src/interpreter.archi.md) — section "FOREACH EXECUTION" details `if=` inside a loop
