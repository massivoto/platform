## Turing complete flow without blocks

```oto
@debug/print var=name forEach=monitors->name
@debug/print value=name if={name != "test"}
@math/increment input=i step=2 while={i < 10}
```

## 2. Control blocks with `@begin/...` and `@end/...`

Blocks are control instructions that wrap a list of child instructions.

They are always delimited by:

- `@begin/<type> ...`
- `@end/<type>`

Defined types:

- `@begin/forEach` … `@end/forEach`
- `@begin/block if=...` … `@end/block`
- `@begin/block while=...` … `@end/block`

More attributes (`pause`, `stream`, `break`, `continue`, `goto` etc.) can be added
later on `@begin/block`.

---

## 3. `@begin/forEach` loop

### Syntax

```oto
@begin/forEach item="itemVar" of=<collectionExpr> [index="indexVar"]
  ... child instructions ...
@end/forEach
```

- `item` _(required)_: **string literal** naming the variable to inject into the
  context.
- `of` _(required)_: expression that must evaluate to an iterable collection.
  - `of=monitors` → `context.data.monitors`
  - `of=data.monitors` → same, explicit
  - `of={monitors:keys}` → pipe expression

- `index` _(optional)_: string literal naming the variable for the zero-based
  index.
