# Commands

Every OTO program is a sequence of commands. This guide explains the anatomy of a command, the difference between reserved and regular arguments, and how to capture output.

## Anatomy

```
@package/name arg1=value1 arg2=value2 output=resultName
```

| Part | Example | Meaning |
|------|---------|---------|
| Sigil | `@` | Marks the line as a command |
| Package | `ai` | Top-level namespace |
| Name | `text` | Verb / specific action |
| Args | `prompt="hello"` | Key-value pairs |
| Output | `output=greeting` | Where to store the result |

A minimal command needs at least a package and a name (`@utils/log`). Subcommands are allowed: `@ai/image/generate`, `@crawl/session/open`. There is no upper limit on path depth, but two segments cover most cases.

```oto
@utils/log message="hello"
@ai/text prompt="Write a haiku" output=poem
@ai/image/generate prompt="a fox in snow" output=image
```

## Two flavors of arguments

OTO arguments come in two kinds: **reserved** and **regular**.

### Reserved args

Reserved args are interpreted by the **language**, not by the command. They look the same syntactically but have special semantics.

| Reserved arg | What it does |
|---|---|
| `output=name` | Captures the command's return value into the variable `name` |
| `if=condition` | Skips the command unless the condition is truthy |
| `forEach=src->item` | Repeats the command once per element in `src`, binding each to `item` |
| `retry=N` | On failure, re-runs the command up to N additional times |
| `collect=name` | Accumulates a value into the array `name` (typically with `forEach`) |
| `label=name` | Marks this instruction as a jump target for `@flow/goto` |
| `while=condition` | Repeats while truthy (reserved for blocks) |

You will see these on many commands. They all behave the same way regardless of which command they decorate. See [iteration.md](./iteration.md) for `forEach`, `collect`, `retry`, and [conditions](./variables-and-expressions.md) for `if`.

### Regular args

Everything else is regular. Regular args are passed to the command's handler, which decides what they mean.

```oto
@ai/text prompt="Summarize this" temperature=0.7 maxTokens=200 output=summary
```

Here `prompt`, `temperature`, and `maxTokens` are regular — they only mean something to the `@ai/text` handler. Another command could ignore them or interpret them differently.

## Capturing output

`output=` writes the command's result into a variable. Variables are scope-aware (see [variables-and-expressions.md](./variables-and-expressions.md)) but for a flat program the rule is simple: `output=greeting` makes `greeting` available to every following line.

```oto
@utils/set input="Hello, world" output=greeting
@utils/log message=greeting
```

If you do not set `output=`, the result is computed and discarded. This is normal for commands you call for their side effect — `@utils/log`, `@file/save`, etc.

## Writing into the current scope vs. program-wide

By default, `output=name` writes to `context.data`, the program-wide store. To write to the current block scope only (visible inside a `forEach` body, invisible outside), use `output=scope.name`:

```oto
@block/begin forEach=users->user
  @ai/text prompt="Greet {user.name}" output=scope.greeting
  @utils/log message=greeting
@block/end
```

`greeting` exists only inside the loop body. Outside, it is undefined. This matters when an inner write would otherwise overwrite a same-named outer variable.

## Listing the built-in commands

Massivoto ships with these core handlers:

| Namespace | Commands |
|---|---|
| `@utils/` | `log`, `set` |
| `@ai/` | `text`, `image/generate`, `prompt/reverseImage` |
| `@flow/` | `goto`, `exit`, `return` |
| `@human/` | `confirm`, `grid` |
| `@file/` | `save`, `write` |
| `@web/` | `fetch` |
| `@crawl/` | `session/open`, `page`, `follow`, `extract`, `fetch`, `example`, `directory` |

Each handler lives at `massivoto-interpreter/src/core-handlers/<namespace>/`. Open the source to see exact arg names and types.

## Comments

Single-line `//` and block `/* ... */` comments are supported:

```oto
// This is the greeting setup
@utils/set input="Mars" output=planet  // inline comment
/*
   Multi-line comments are fine too.
*/
@utils/log message="Hello from {planet}"
```

## What about errors?

If a command fails:

- Without `retry=`: the program stops with a fatal error. The exit code is non-zero.
- With `retry=N`: the runtime re-runs the command up to N more times. If all retries fail, the program stops.

Errors are recorded in `context.meta.history` as `InstructionLog` entries with `success: false` and a `fatalError` field.

## References

- **Other guides:**
  - [variables-and-expressions.md](./variables-and-expressions.md) for what goes on the right-hand side of `=`
  - [iteration.md](./iteration.md) for `forEach`, `collect`, `retry`
  - [system-variables.md](./system-variables.md) for `$index` and friends
- **DSL specification:** [`../dsl-specification/dsl-0.5.md`](../dsl-specification/dsl-0.5.md) — formal grammar including reserved-arg list
- **Identifier roles:** [`../dsl-specification/identifier-roles.md`](../dsl-specification/identifier-roles.md) — why `output=` vs `forEach=...->target` get different AST nodes
- **Source code:**
  - `massivoto-interpreter/src/core-handlers/utils/log.handler.ts` — example of a minimal handler
  - `massivoto-interpreter/src/core-handlers/ai/text.handler.ts` — handler with many regular args
  - `massivoto-interpreter/src/parser/shared-parser.ts` — where reserved args are recognized
- **Architecture:** [`../../../massivoto-interpreter/src/interpreter.archi.md`](../../../massivoto-interpreter/src/interpreter.archi.md) — execution model, output target resolution
- **Done feature PRDs:**
  - [`features/_done/identifier-roles/step1-rename-bare-string.done.prd.md`](../../../features/_done/identifier-roles/step1-rename-bare-string.done.prd.md)
  - [`features/_done/identifier-roles/step2-binding-reference.done.prd.md`](../../../features/_done/identifier-roles/step2-binding-reference.done.prd.md)
