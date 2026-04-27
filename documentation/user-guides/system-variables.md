# System Variables

System variables are values the runtime injects into your scope automatically. The most common ones tell you where you are inside a `forEach` loop.

## The `$` family (forEach scope)

When `forEach` runs, the runtime injects seven variables into the iteration scope. They are all read-only and reset on every iteration.

| Variable | Type | Meaning |
|----------|------|---------|
| `$index` | number | Zero-based position (0, 1, 2, ...) |
| `$count` | number | One-based count (1, 2, 3, ...) |
| `$length` | number | Total items in the iterable |
| `$first` | boolean | True on the first iteration |
| `$last` | boolean | True on the last iteration |
| `$odd` | boolean | True when `$count` is odd |
| `$even` | boolean | True when `$count` is even |

These are **only available inside a `forEach`**. Outside, they are undefined.

## Examples

### Numbering output items

```oto
@utils/log message="Item {$count} of {$length}: {item.title}" forEach=items->item
```

Logs:

```
Item 1 of 3: Apples
Item 2 of 3: Oranges
Item 3 of 3: Bananas
```

### Skipping the first or last

```oto
@ai/text prompt="Summarize {chapter.body}" forEach=chapters->chapter if={!$first} collect=summaries
```

Skips the first chapter (often a preface).

### Building file paths with the index

```oto
@file/save data={image.bytes} file={["./out/photo-", $index, ".png"] | join} forEach=images->image
```

Produces `./out/photo-0.png`, `./out/photo-1.png`, etc.

### Alternating styling

```oto
@utils/log message="{$odd}: {item}" forEach=items->item
```

### Conditional batching at the end

```oto
@email/send recipients=batchEmails if={$last} forEach=users->user collect=batchEmails
```

Builds a list as it iterates, but only sends after the last user is processed.

## Where they appear in evaluation

System variables sit at the top of the scope chain when the iteration body runs. They are pushed when the iteration begins and popped when it ends. Variable resolution order is:

1. **Iteration scope** — `$index`, `$count`, plus your iterator binding (`user`, `article`, etc.)
2. **Outer block scope** (if any)
3. **`context.data`** — program-wide variables
4. **`undefined`**

## Counting before vs after `if=` filter

The `$` family counts the **whole** iterable, not the filtered subset.

```oto
@utils/log message="Processing {$count}/{$length}" forEach=items->item if={item.active}
```

If you have 10 items and 3 are active:

- `$length` is **10** every time
- `$count` is **2, 5, 9** (the original positions of the active items)
- The handler runs 3 times

If you need filtered counts, run `@utils/set input={items | filter:active} output=actives` first, then iterate `actives`.

## Other system variables (not yet implemented)

The roadmap mentions:

- `$timestamp` — current ISO timestamp at the moment of injection
- `$runId` — unique id for the current program run

These are planned, not implemented. Do not rely on them in current programs.

## Naming note

The `$` sigil for system variables is the **current** convention. The roadmap proposes renaming to `_index`, `_count`, etc., to free `$` for streaming features in a future version. When that lands, both forms may be supported during a transition period. For now, write `$index`.

## Pitfalls

**Using `$index` outside `forEach`.** It is undefined. The runtime does not throw — it just returns nothing. Common mistake: copy-pasting a logging line out of a loop.

**Confusing `$index` and `$count`.** `$index` is zero-based (matches array indexing). `$count` is one-based (matches "Item 1, Item 2, ..." display).

**Thinking `$length` updates with `if=`.** It does not — see above.

## References

- **DSL specification:** [`../dsl-specification/dsl-0.5.md`](../dsl-specification/dsl-0.5.md) — system-variable token recognition (`$identifier` regex)
- **Other guides:**
  - [iteration.md](./iteration.md) — `forEach`, where these variables live
  - [variables-and-expressions.md](./variables-and-expressions.md) — scope chain lookup
- **Architecture:** [`../../../massivoto-interpreter/src/interpreter.archi.md`](../../../massivoto-interpreter/src/interpreter.archi.md) — section "FOREACH EXECUTION" details where injection happens
- **Source code:**
  - `massivoto-interpreter/src/core-interpreter.ts` — `executeForEachInstruction()` injection point
  - `massivoto-interpreter/src/parser/shared-parser.ts` — `systemVariable` parser token
- **Done feature PRDs:**
  - `massivoto-interpreter/src/system-variables.done.prd.md` — original specification
- **Roadmap:** [`../../../ROADMAP.md`](../../../ROADMAP.md) — section "Variable names - PROBLEM" tracks the proposed `$` → `_` rename
