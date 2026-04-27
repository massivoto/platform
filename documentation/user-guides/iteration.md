# Iteration

`forEach=` lets you run a command once per element of a collection. With `collect=` you gather the results, with `retry=` you handle failures, and with `if=` you skip items.

## The basics

```oto
@ai/text prompt="Greet {user.name}" forEach=users->user collect=greetings
```

Read this as: "for each `user` in `users`, run `@ai/text` with that user, and accumulate each result into the array `greetings`".

The pieces:

| Part | Role |
|------|------|
| `forEach=users->user` | The collection (left of `->`) and the iterator name (right of `->`) |
| `collect=greetings` | Accumulate per-iteration results into this array |

After the loop, `greetings` is an array with one entry per user.

## The mapper `->`

`forEach=src->item` is a **mapper**. The left side reads from scope, the right side introduces a new binding visible *inside the iteration only*.

```oto
@ai/describe image=photo forEach=images->photo collect=descriptions
```

`images` is read from scope. `photo` is created fresh for each iteration and discarded after. You cannot reference `photo` outside the loop.

The left side can be a path:

```oto
@utils/log message=line forEach=data.lines->line
```

The right side must be a single fresh identifier — no paths, no expressions.

## `collect` vs `output`

`output=` and `collect=` are mutually exclusive on the same instruction.

| Reserved arg | Without `forEach` | With `forEach` |
|--------------|------------------|---------------|
| `output=name` | Stores the single result | Stores the LAST iteration's result (rarely useful) |
| `collect=name` | Wraps the result in `[result]` | Builds an array of all results in iteration order |

Rule of thumb: with `forEach`, use `collect`. Without `forEach`, use `output`.

## Filtering inside a loop with `if=`

`if=` evaluates a condition before each iteration. If falsy, the command is skipped (and nothing is collected for that item).

```oto
@ai/text prompt="Summarize {article.body}" forEach=articles->article if={article.published} collect=summaries
```

The precedence is:

1. `forEach=` produces an item and binds it (e.g. `article`).
2. `if=` evaluates with the item in scope.
3. If false: skip, do not call the handler, do not collect.
4. If true: `retry=` budget applies, command runs, result is collected.

`if=` works without `forEach` too — it acts as a guard on the whole instruction:

```oto
@ai/text prompt="Welcome back!" if={user.returning} output=greeting
```

## Retrying on failure

```oto
@ai/text prompt="Generate a tagline" retry=3 output=tagline
```

If `@ai/text` fails (network timeout, API error, etc.), the runtime retries up to 3 more times before giving up. Combine with `forEach` and each iteration gets its own retry budget:

```oto
@ai/image/generate prompt={situationPrompt} forEach=prompts->situationPrompt retry=2 collect=images
```

If image generation for prompt #4 fails twice, the runtime moves on to prompt #5 (the failure is recorded but the loop continues). If all retries exhaust on a single item, the entire program halts unless you wrap it in something more elaborate.

## Order of operations

When all reserved args appear together, the runtime applies them in this fixed order:

```
forEach  →  if  →  retry  →  execute  →  output / collect
```

Translated:

1. Pop the next item from `forEach`.
2. Bind the iterator (e.g. `user`).
3. Inject system variables (`$index`, `$count`, `$first`, etc. — see [system-variables.md](./system-variables.md)).
4. Check `if=`. Skip if false.
5. Run the command, retrying on failure up to `retry` times.
6. Write the result via `output=` or append it via `collect=`.
7. Pop the iteration scope.

## Iterating with blocks

For multi-step iteration, use a block:

```oto
@block/begin forEach=articles->article
  @ai/text prompt="Translate to French: {article.body}" output=scope.fr
  @ai/text prompt="Translate to Spanish: {article.body}" output=scope.es
  @file/save data={[fr, es]} file={["./out/", article.id, ".json"] | join}
@block/end
```

Inside `@block/begin ... @block/end`, the block forms a unit. `forEach` on `@block/begin` runs the whole body once per element. `output=scope.X` keeps `X` local to each iteration so iterations do not stomp on each other.

## Iterating over files

Globs are first-class values. Use them with `forEach`:

```oto
@ai/describe image=photo forEach=~/images/races/*.jpg->photo collect=descriptions
```

`~/images/races/*.jpg` evaluates to an array of file references at parse time, then `forEach` walks them.

## Pitfalls

**Forgetting `collect`.** Without it, only the last iteration's result is kept (via `output=`) or no result is kept at all. Almost every loop wants `collect=`.

**Bare iterator name in the body.** `forEach=articles->article` introduces `article` as a binding source. Inside the body, `article` is read from scope — but only when **inside braces**. `prompt=article` sends the literal string `"article"`. Use `prompt={article.body}` or `prompt="Summary: {article.body}"`.

**Mutating the source.** `forEach` reads the iterable once. Adding items to `articles` mid-loop has no effect on the iteration count.

## References

- **Other guides:**
  - [system-variables.md](./system-variables.md) — `$index`, `$count`, `$first`, `$last`, `$odd`, `$even`
  - [variables-and-expressions.md](./variables-and-expressions.md) — when to brace
  - [pipes.md](./pipes.md) — when to use a pipe instead of `forEach`
- **DSL specification:** [`../dsl-specification/dsl-0.5.md`](../dsl-specification/dsl-0.5.md) — `forEach`, `if`, `retry`, `collect` reserved args
- **Identifier roles:** [`../dsl-specification/identifier-roles.md`](../dsl-specification/identifier-roles.md) — why `forEach=src->target` decomposes into a `ReferenceNode` and a `BindingNode`
- **Architecture:** [`../../../massivoto-interpreter/src/interpreter.archi.md`](../../../massivoto-interpreter/src/interpreter.archi.md) — section "FOREACH EXECUTION (with filter pattern)" details the precedence
- **Source code:**
  - `massivoto-interpreter/src/core-interpreter.ts` — `executeForEachInstruction()` and `executeForEachWithStatementList()`
  - `massivoto-interpreter/src/parser/args-details/mapper-parser.ts` — parsing of `->`
- **Done feature PRDs:**
  - [`features/_done/identifier-roles/step2-binding-reference.done.prd.md`](../../../features/_done/identifier-roles/step2-binding-reference.done.prd.md) — the AST split that powers `forEach`
