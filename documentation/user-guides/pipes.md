# Pipes

Pipes transform data inside a braced expression. They are how you filter, map, slice, and reshape values without writing extra commands.

## Syntax

```
{ source | pipe : arg1 : arg2 ... | nextPipe : arg | ... }
```

- The whole pipe chain lives **inside braces**.
- `|` separates stages.
- `:` separates the pipe name from its arguments.
- Stages run **left to right**.

```oto
@utils/set input={users | filter:active | map:name | join:", "} output=greeting
```

This reads as: take `users`, keep the active ones, extract their names, join with commas.

## The 11 core pipes

| Pipe | Purpose | Example |
|------|---------|---------|
| `filter` | Keep elements matching a predicate | `{users \| filter:active}` |
| `map` | Extract a property from each element | `{users \| map:name}` |
| `first` | First element of an array | `{items \| first}` |
| `last` | Last element of an array | `{items \| last}` |
| `tail` | Last N elements | `{items \| tail:3}` |
| `slice` | Subarray by index | `{items \| slice:1:4}` |
| `join` | Concatenate array to string | `{names \| join:", "}` |
| `length` | Count elements / characters / keys | `{items \| length}` |
| `flatten` | Unwrap one level of nested arrays | `{nested \| flatten}` |
| `reverse` | Reverse the array (non-mutating) | `{items \| reverse}` |
| `unique` | Remove duplicates | `{tags \| unique}` |

A 12th pipe `path` is registered but rarely needed — dot notation (`{user.profile.name}`) covers most cases.

## Pipe-by-pipe walkthrough

### `filter`

Two forms:

```oto
{users | filter:active}           // keeps users where active is truthy
{users | filter:status:"done"}    // keeps users where status === "done"
```

The first form checks truthiness on a single property. The second checks equality against a value.

### `map`

```oto
{users | map:name}                // ["Emma", "Bob", "Cleo"]
{users | map:profile.email}       // dot-paths work
```

Returns a new array with one entry per source item.

### `first` / `last` / `tail`

```oto
{items | first}      // items[0]
{items | last}       // items[items.length - 1]
{items | tail:3}     // last 3 items
```

`first` and `last` take no args. `tail` takes a count.

### `slice`

```oto
{items | slice:2}        // from index 2 to end
{items | slice:1:4}      // from index 1 (inclusive) to 4 (exclusive)
```

JavaScript-style: end is exclusive.

### `join`

```oto
{names | join:", "}      // "Emma, Bob, Cleo"
{names | join}           // default separator is empty string
```

Always returns a string.

### `length`

```oto
{items | length}         // number of array elements
{name | length}          // number of characters in a string
{user | length}          // number of own keys in an object
```

### `flatten`

```oto
{[[1,2], [3,4]] | flatten}     // [1, 2, 3, 4]
```

One level only. Deep flattening requires chaining or splitting into commands.

### `reverse`

```oto
{items | reverse}        // copy with order reversed
```

Non-mutating: the source array is not modified.

### `unique`

```oto
{[1,2,2,3,3,3] | unique}    // [1, 2, 3]
```

Preserves first-occurrence order.

## Chaining

Pipes are designed to chain. Read left-to-right:

```oto
@utils/log message="{users | filter:active | map:name | join:", "}"
```

"Take users, keep active ones, get their names, join with comma."

A long chain can become unreadable. Two ways to keep it clean:

- Split into intermediate variables with `@utils/set`.
- Use `forEach=` and per-iteration logic (see [iteration.md](./iteration.md)).

```oto
@utils/set input={users | filter:active} output=activeUsers
@utils/set input={activeUsers | map:name} output=activeNames
@utils/log message="{activeNames | join:", "}"
```

## Pipes and other expressions

Pipes are an expression like any other. They can be:

- Assigned: `@utils/set input={items | first} output=top`
- Used in conditions: `if={items | length > 0}`
- Embedded in strings: `"You have {tasks | filter:open | length} open tasks"`
- Passed to commands: `@ai/text prompt="Summarize: {articles | map:title | join:", "}"`

## A pipe is not a transformation function

Pipes are **declarative**. You do not write `function(x) { return x.filter(...) }`. You declare the transformation in the data flow. The runtime applies them in order.

This means you cannot:

- Define your own pipes from inside a `.oto` file (custom pipes require a JS module — out of scope of beginner docs)
- Use a pipe outside braces (a future relaxation, see roadmap)

## What about `forEach`?

`forEach=` runs a whole *command* per item. Pipes transform an *expression*. Use pipes when you want a value; use `forEach` when you want N actions.

```oto
// Use a pipe — one action, transformed input
@ai/text prompt="Summarize: {articles | map:title | join:", "}" output=summary

// Use forEach — one action per article
@ai/text prompt="Summarize {article.title}" forEach=articles->article collect=summaries
```

## References

- **DSL specification:** [`../dsl-specification/pipe.md`](../dsl-specification/pipe.md) — formal grammar, precedence, edge cases
- **Other guides:**
  - [variables-and-expressions.md](./variables-and-expressions.md) — what else goes inside `{}`
  - [iteration.md](./iteration.md) — `forEach=` for per-element commands
- **Architecture:** [`../../../massivoto-interpreter/src/pipe-registry/pipe-registry.archi.md`](../../../massivoto-interpreter/src/pipe-registry/pipe-registry.archi.md) — registry pattern for built-in and custom pipes
- **Source code:**
  - `massivoto-interpreter/src/pipe-registry/core-pipes-bundle.ts` — implementation of all 11 core pipes
  - `massivoto-interpreter/src/pipe-registry/types.ts` — `PipeFunction` interface for adding custom pipes
- **Done feature PRDs:**
  - [`features/_done/identifier-roles/step4-pipes-outside-braces.done.prd.md`](../../../features/_done/identifier-roles/step4-pipes-outside-braces.done.prd.md) — the parser change that lets pipes appear in any expression position
