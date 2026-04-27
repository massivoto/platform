# Files and Globs

OTO treats file paths and glob patterns as first-class values. You can write them anywhere a value is expected, pass them between commands, and iterate over them with `forEach`.

## File literals — the `~/` prefix

A path starting with `~/` is a **file literal**:

```oto
@file/save data="hello" file=~/output.txt
@ai/describe image=~/photos/portrait.jpg output=description
```

The `~/` is not your home directory. It means "**relative to the project root**". The project root is the directory you ran `oto run` in, or what the runner injected via `context.fileSystem.projectRoot`.

So:

- `~/output.txt` resolves to `<project-root>/output.txt`
- `~/photos/portrait.jpg` resolves to `<project-root>/photos/portrait.jpg`

Paths that try to escape the project root (`~/../etc/passwd`) are rejected at evaluation time. This is a deliberate security boundary — see [security.md](./security.md).

## What a file literal *is*

When the evaluator sees `~/output.txt`, it produces a `FileReference` object:

```typescript
{
  type: 'file-ref',
  relativePath: 'output.txt',
  absolutePath: '/full/path/to/output.txt'
}
```

Commands that take a file argument expect either a string path or a `FileReference`. Passing a file literal works in both cases.

## Glob patterns

A glob is a `~/`-prefixed path containing `*`, `**`, or `?`:

```oto
~/images/*.jpg          // all jpg files in images/
~/data/**/*.json        // all json files anywhere under data/
~/logs/oto-*.log        // log files matching the pattern
```

Globs evaluate to an **array of `FileReference` objects**, sorted alphabetically. Empty matches return `[]`, not an error.

## Iterating over files

Globs feed `forEach` directly:

```oto
@ai/describe image=photo forEach=~/images/races/*.jpg->photo collect=descriptions
```

For each `.jpg` file under `images/races/`:

1. Bind `photo` to the file reference.
2. Run `@ai/describe`.
3. Append the description.

Inside the body, you can read `photo.relativePath`, `photo.absolutePath`, etc. via member access:

```oto
@utils/log message="Processing {photo.relativePath}" forEach=~/images/*.jpg->photo
```

## `@file/save`

```oto
@file/save data=summary file=~/output/summary.txt
@file/save data={result | toJson} file=~/output/result.json
```

`@file/save` writes data to disk. The `file` argument is a file literal or a string. The handler creates intermediate directories as needed.

For binary data (an AI-generated image, etc.), the handler accepts a Buffer or base64 string and writes bytes:

```oto
@ai/image/generate prompt="A racing car" output=image
@file/save data={image} file=~/out/racing.png
```

## Building dynamic paths

Sometimes you need a path computed at runtime — for example, one file per iteration. The pattern:

```oto
@ai/image/generate prompt={situation} forEach=situations->situation collect=images
@file/save data=image file={["~/out/image-", $index, ".png"] | join} forEach=images->image
```

Two techniques in one example:

- `[..., $index, ...]` builds an array.
- `| join` (no separator) concatenates it into a string.

The runtime treats the resulting string starting with `~/` as if it were a file literal — it resolves against `projectRoot` and applies the same security check.

If you find yourself doing this often, prefer passing the components as separate args and let the handler join them — but until OTO has a built-in path builder, the array+join pattern is idiomatic.

## Reading vs writing

| Operation | Command | Notes |
|-----------|---------|-------|
| Read text | `@file/read file=~/...` (planned) | Today, most handlers that need a file accept a path arg directly |
| Write text | `@file/save data=... file=~/...` | Creates parent directories |
| Write binary | `@file/save data={imageBuffer} file=~/...` | Same handler, detects Buffer |
| List files | `~/glob` | Glob expansion |
| Iterate | `forEach=~/glob->item` | Each item is a FileReference |

## Project root

The project root is set by the runner. The default is `process.cwd()`. You can override:

```bash
oto run script.oto --context context.json
```

…where `context.json` includes `fileSystem.projectRoot`. The evaluator uses this for both file literals and glob expansion.

If `fileSystem` is not set on the context (e.g. a SaaS runner with cloud-only storage), file literals throw an `EvaluationError`. The local CLI always sets one.

## Pitfalls

**`~/` is not your home directory.** Unlike a Unix shell, `~/` here is the **project root**, not `$HOME`. If you really want home, set an env var: `~/{env.HOME}/...` is invalid — the `~/` and the brace would conflict. Use an absolute path string instead.

**Glob with no matches.** Returns `[]`. `forEach=~/none/*.txt->x` runs zero times — silently. Add a check if you want to fail fast: `if={files | length > 0}`.

**Forgetting `~/` for a file argument.** Bare `output.txt` is a literal string. `@file/save file=output.txt` writes to a file literally named `output.txt` in the current directory — but only because the handler tolerates strings. For consistency, always use `~/output.txt`.

**Globbing across the project root.** `~/../something` is rejected. If your data lives outside the project, copy or symlink it inside, or run `oto` from a different directory.

## References

- **Other guides:**
  - [variables-and-expressions.md](./variables-and-expressions.md) — member access on `FileReference` objects
  - [iteration.md](./iteration.md) — `forEach` over a glob
  - [security.md](./security.md) — why paths cannot escape the project root
- **DSL specification:** [`../dsl-specification/file-usage.md`](../dsl-specification/file-usage.md) — formal specification for file and glob literals
- **Source code:**
  - `massivoto-platform/packages/kit/src/domain/file-reference.ts` — the `FileReference` interface
  - `massivoto-interpreter/src/evaluator/evaluators.ts` — `evaluateFileLiteral`, `evaluateGlobLiteral`
  - `massivoto-interpreter/src/core-handlers/file/file-save.handler.ts` — `@file/save` implementation
- **Architecture:** [`../../packages/runtime/runtime.archi.md`](../../packages/runtime/runtime.archi.md) — section "File System Configuration" describes `projectRoot` and the security check
- **Done feature PRDs:**
  - [`features/data-access/file-access-runtime.done.prd.md`](../../../features/data-access/file-access-runtime.done.prd.md) — runtime support for file literals and globs
