Here’s the block documentation in English, aligned with your conventions.

---

## 1. Runtime context (ExecutionContext)

```ts
export interface ExecutionContext {
  env: Record<string, string> // not saved nor shared
  data: Record<string, any>
  extra: any
  meta: {
    tool?: string
    history: InstructionLog[]
    updatedAt: ReadableDate
  }
  user: {
    id: string
    extra: Serializable
  }
  store: SerializableStorePointer
  prompts: string[]
  cost: {
    current: number   // current cost in cents
    estimated: number // estimated cost in cents
    maximum: number   // max cost allowed for this run
    credits: number   // credits available for the user
  }
}
```

### Resolution rules

* By default, a **bare identifier** (e.g. `monitors`, `users`, `i`) is resolved as:

  ```txt
  <id>  ≡  data.<id>  ≡  context.data[<id>]
  ```

* Explicit access:

    * `data.users`   → `context.data.users`
    * `env.API_KEY`  → `context.env.API_KEY`
    * `store.foo.bar` → path in the `SerializableStorePointer`
    * `user.id`, `meta.history`, `cost.current`, etc.

* `output` **must** start with `data.`, `store.` or `prompt.`
  (no implicit target for writes).

* Each instruction is **async**. The engine awaits it before moving to the next one.

* Every instruction has a **base cost**; blocks (`forEach`, `while`) may multiply that cost by the number of iterations.


---

## 4. Conditional block: `@start/block if=...`

### Syntax

```oto
@start/block if=<conditionExpr>
  ... child instructions ...
@end/block
```

* `if`: expression evaluated in the current context.
  It must evaluate to a boolean (or something the runtime can coerce to boolean).

### Execution semantics

1. Evaluate `conditionExpr`.
2. If the result is:

    * `true`  → execute the body sequentially (awaiting each instruction).
    * `false` → skip the body entirely.
3. The block does **not** introduce a new scope: any mutation of `context.data` inside the body is visible after the block.

### Examples

Using an expression:

```oto
@start/block if={foundUser}
  @print/users users={users:tail:10}
  @email/send template="welcome" users={users}
@end/block
```

Using a bare identifier:

```oto
@start/block if=foundUser
  @print/users users={users:first:1}
@end/block
```

---

## 5. While loop: `@start/block while=...`

### Syntax

```oto
@start/block while=<conditionExpr>
  ... child instructions ...
@end/block
```

* On a given `@start/block`, **only one** of `if` or `while` may be defined.

### Execution semantics

1. Evaluate the `while` expression in the current `ExecutionContext`.
2. While the result is `true`:

    * execute the body sequentially (awaiting each instruction),
    * re-evaluate the condition.
3. Exit when the condition becomes `false`, or when the runtime stops the loop (e.g. cost limit).

**Note:** termination is the responsibility of the script author. The engine may enforce safety guards (max iterations, max cost, timeout, etc.).

### Example

```oto
@start/block while={i < 10}
  @utils/doSomething value={i}
  @utils/increment input={i} output=data.i
@end/block
```

---

## 6. Name resolution inside blocks

Within blocks, expressions and arguments follow the global rules:

* **String literal**: quoted

    * `item="monitor"` → literal `"monitor"`, interpreted by the engine as a *variable name*.

* **Data reference**:

    * `users=monitors`   → `context.data.monitors`
    * `if=foundUser`     → `context.data.foundUser`
    * `while=data.i < 10` → `context.data.i`

* **Pipe expression**:

    * `users={users:tail:10}`
    * `of={monitors:keys}`

* **Other namespaces** (env, store, user, cost, meta) must be explicit:

    * `if=env.FEATURE_FLAG_X`
    * `of=store.monitoring.activeList`
    * `if=cost.current < cost.maximum`

---

## 7. Combined examples

### ForEach + If

```oto
@start/forEach item="monitor" of=monitors index="i"
  @start/block if={monitor.status == "ERROR"}
    @alert/notify monitor={monitor} index={i}
  @end/block
@end/forEach
```

### While inside a ForEach

```oto
@start/forEach item="monitor" of=monitors
  @start/block while={monitor.retries < 3 && !monitor.ok}
    @monitor/ping monitor={monitor} output=data.monitor
  @end/block
@end/forEach
```

This gives you a precise, unambiguous spec for `@start/forEach` and `@start/block` (`if` / `while`), fully aligned with your `ExecutionContext`, data resolution rules, and cost model.
