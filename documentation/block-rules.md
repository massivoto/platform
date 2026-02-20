## Turing complete flow without blocks

```oto
@debug/print var=name forEach=monitors->name
@debug/print value=name if={name != "test"}
@math/increment input=i step=2 while={i < 10}
```

## 2. Control blocks with `@block/begin` and `@block/end`

Blocks are control instructions that wrap a list of child instructions.

They are always delimited by:

- `@block/begin ...`
- `@block/end`

Block reserved arguments:

- `forEach=<iterable> -> <iterator>` — loop over a collection
- `if=<condition>` — conditional execution
- `while=<condition>` — loop while condition is true

`forEach=` and `if=` are mutually exclusive on the same block.

More attributes (`pause`, `stream`, `break`, `continue`, `goto` etc.) can be added
later on `@block/begin`.

---

## 3. `@block/begin forEach=` loop

### Syntax

```oto
@block/begin forEach=<collectionExpr> -> <iteratorVar>
  ... child instructions ...
@block/end
```

- `forEach=` _(required)_: uses mapper syntax `<iterable> -> <iterator>`.
  - Left side: any expression evaluating to an array.
  - Right side: variable name (single string) injected into scope.
- Examples:
  - `forEach=users -> user`
  - `forEach=data.users -> user`
  - `forEach={users|filter:active} -> user`
  - `forEach=[1, 2, 3] -> num`
  - `forEach=~/images/races/*.jpg -> photo` — glob pattern (resolves to array of file references)

### System variables

Inside a forEach block, these variables are automatically available:

| Variable | Type | Description |
|----------|------|-------------|
| `_index` | number | 0-based iteration index |
| `_count` | number | 1-based iteration count |
| `_length` | number | Total array length |
| `_first` | boolean | true only on first iteration |
| `_last` | boolean | true only on last iteration |
| `_odd` | boolean | true if count is odd |
| `_even` | boolean | true if count is even |
