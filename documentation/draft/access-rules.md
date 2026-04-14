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
    current: number // current cost in cents
    estimated: number // estimated cost in cents
    maximum: number // max cost allowed for this run
    credits: number // credits available for the user
  }
}
```

### Resolution rules

- By default, a **bare identifier** (e.g. `monitors`, `users`, `i`) is resolved
  as:

  ```txt
  <id>  ≡  context.data[<id>]  # by default a variable is looked up in data
  data.<id>  ≡  context.data.data[<id>] # therefore data.x has no special meaning
  scope.<id>  ≡  context.scope[<id>]  # However scope is treated specially in lookups
  store.<id>  ≡  context.store->load('id')  # as well as store, which looksup in an async way
  ```

Fetching in store is async, so probably the Evaluator needs to be async too.

- Explicit access:
  - `users` → `context.data.users`
  - `data.users` → `context.data.data.users`
  - `scope.users` → `context.scopeChain` lookup (walks chain)
  - `env.API_KEY` → `context.env.API_KEY` (READ-ONLY)
  - `store.foo.bar` → path in the `SerializableStorePointer`
  - `user.id`, `meta.history`, `cost.current`, etc. (READ-ONLY)

- Each instruction is **async**. The runtime awaits it before moving to the next
  one.

- Every instruction has a **base cost**; blocks (`forEach`, `while`) may
  multiply that cost by the number of iterations.

---

## 4. Conditional block: `@block/begin if=...`

### Syntax

```oto
@block/begin if=<conditionExpr>
  ... child instructions ...
@block/end
```

- `if`: expression evaluated in the current context. It must evaluate to a
  boolean (or something the runtime can coerce to boolean).

### Execution semantics

1. Evaluate `conditionExpr`.
2. If the result is:
   - `true` → execute the body sequentially (awaiting each instruction).
   - `false` → skip the body entirely.

3. The block does **not** introduce a new scope: any mutation of `context.data`
   inside the body is visible after the block.

### Examples

Using an expression:

```oto
@block/begin if={foundUser}
  @print/users users={users:tail:10}
  @email/send template="welcome" users={users}
@block/end
```

Using a bare identifier:

```oto
@block/begin if=foundUser
  @print/users users={users:first:1}
@block/end
```

---

## 5. While loop: `@block/begin while=...`

### Syntax

```oto
@block/begin while=<conditionExpr>
  ... child instructions ...
@block/end
```

- On a given `@block/begin`, **only one** of `if` or `while` may be defined.

### Execution semantics

1. Evaluate the `while` expression in the current `ExecutionContext`.
2. While the result is `true`:
   - execute the body sequentially (awaiting each instruction),
   - re-evaluate the condition.

3. Exit when the condition becomes `false`, or when the runtime stops the loop
   (e.g. cost limit).

**Note:** termination is the responsibility of the script author. The runtime may
enforce safety guards (max iterations, max cost, timeout, etc.).

### Example

```oto
@block/begin while={i < 10}
  @utils/doSomething value={i}
  @utils/increment input={i} output=data.i
@block/end
```

---

## 6. Name resolution inside blocks

Within blocks, expressions and arguments follow the global rules:

- **String literal**: quoted
  - `item="monitor"` → literal `"monitor"`, interpreted by the runtime as a
    _variable name_.

- **Data reference**:
  - `users=monitors` → `context.data.monitors`
  - `if=foundUser` → `context.data.foundUser`
  - `while=data.i < 10` → `context.data.i`

- **Pipe expression**:
  - `users={users:tail:10}`
  - `of={monitors:keys}`

- **Other namespaces** (env, store, user, cost, meta) must be explicit:
  - `if=env.FEATURE_FLAG_X`
  - `of=store.monitoring.activeList`
  - `if=cost.current < cost.maximum`

---

## 7. Combined examples

### ForEach + If

```oto
@block/begin forEach=monitors -> monitor
  @block/begin if={monitor.status == "ERROR"}
    @alert/notify monitor={monitor} index={_index}
  @block/end
@block/end
```

### While inside a ForEach

```oto
@block/begin forEach=monitors -> monitor
  @block/begin while={monitor.retries < 3 && !monitor.ok}
    @monitor/ping monitor={monitor} output=data.monitor
  @block/end
@block/end
```

This gives you a precise, unambiguous spec for `@block/begin forEach=` and
`@block/begin` (`if=` / `while=`), fully aligned with your `ExecutionContext`,
data resolution rules, and cost model.
