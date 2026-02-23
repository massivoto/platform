# PRD: File Access Runtime (Evaluator + Path Pipe + Save Command)

**Status:** IMPLEMENTED
**Last updated:** 2026-02-23

> - DRAFT: Coding should not start, requirements being defined
> - APPROVED: Code can start, requirements stable
> - IMPLEMENTED: Tests passing, feature complete
> - ITERATING: Modifying existing code, PRD being updated

## Progress

| Section | Status | Progress |
|---------|--------|----------|
| Context | ✅ Complete | 100% |
| Scope | ✅ Complete | 100% |
| Requirements: FileReference Type | ✅ Complete | 3/3 |
| Requirements: Evaluator | ✅ Complete | 5/5 |
| Requirements: Path Pipe | ✅ Complete | 4/4 |
| Requirements: Save Command | ✅ Complete | 5/5 |
| Requirements: ExecutionContext | ✅ Complete | 3/3 |
| Acceptance Criteria | ✅ Complete | 12/12 |
| Theme | ✅ Defined | - |
| **Overall** | **IMPLEMENTED** | **100%** |

## Parent PRD

- [file-access.brainstorm.md](./file-access.brainstorm.md)

## Child PRDs

- [file-path-parser.done.prd.md](../../../massivoto-interpreter/src/parser/file/file-path-parser.done.prd.md) (IMPLEMENTED — parser phase)

## Context

The parser phase is complete: `~/path` produces `FileLiteralNode` and `~/glob/*.ext` produces
`GlobLiteralNode` as first-class AST nodes. But nothing downstream knows what to do with them.

The evaluator's `switch(expr.type)` (in `evaluators.ts` line 52) has no case for `literal-file`
or `literal-glob`. The pipe registry has no `|path` pipe. There is no `@core/files/save` command.

This PRD completes the v0.6 file access story needed for The Race Was Great image pipeline:

```oto
@ai/prompt/reverseImage image=~/f1.png output=f1RacingPrompt
@ai/generateImage variation=situation content=f1RacingPrompt forEach=situations->situation retry=3 collect=images
@human/validation items=images display=gallery output=selectedImages
@file/save file={["selection/", "f1-",$index,".png"]|path} forEach=selectedImages->image
```

Three pieces are needed:
1. **Evaluator** — resolve `literal-file` to a `FileReference`, resolve `literal-glob` to an array of `FileReference`
2. **`|path` pipe** — join array segments into a file path string
3. **`@file/save` command** — write data (binary, text, JSON) to disk

## Decision Log

| Date | Option | Decision | Rationale |
|------|--------|----------|-----------|
| 2026-02-23 | Evaluator returns content vs FileReference | **FileReference object** | Commands decide whether they need content or path. Avoids loading large binaries into memory when only the path is needed (e.g. `@file/save` destination). |
| 2026-02-23 | Glob eager (load all content) vs lazy (paths only) | **Lazy (paths only)** | Glob returns array of FileReference objects. Content loaded by commands on demand. Performance-safe for large globs. |
| 2026-02-23 | Glob library | **`fast-glob`** | Well-maintained, fast, standard choice. Need to add to massivoto-interpreter dependencies. |
| 2026-02-23 | `~/` prefix in FileReference | **Stripped** | Parser stores `~/images/hero.png` in AST. Evaluator strips `~/` and resolves against `projectRoot` to produce an absolute path. The `~/` is a syntax marker, not part of the real path. |
| 2026-02-23 | Command namespace | **`@file/save`** | Matches existing `@file/write`. The brainstorm says `@core/files/save` but `@file/` is already registered and shorter. Discard the MCP-based `@file/write` and replace with a proper `@file/save`. |
| 2026-02-23 | Where does projectRoot live | **`ExecutionContext.fileSystem.projectRoot`** | New `fileSystem` field on ExecutionContext. Runner provides it. Clean separation from other concerns. |

## Scope

**In scope:**
- `FileReference` type: `{ type: 'file-ref', relativePath: string, absolutePath: string }`
- Evaluator: `literal-file` → `FileReference`, `literal-glob` → `FileReference[]`
- `|path` pipe: join array of strings into a path, reject `..`, normalize slashes
- `@file/save` command: write string/JSON/binary to a file, create parent dirs
- `ExecutionContext.fileSystem.projectRoot`: new field, set by runner
- `fast-glob` dependency addition
- Replace MCP-based `@file/write` with `@file/save`

**Out of scope:**
- `@file/read` or `@file/load` — use inline `~/` resolution instead (commands read files themselves)
- `@file/delete`, `@file/move` — not needed for TRWG
- `@file/list` — use GlobNode `~/images/*` instead
- Multi-store syntax (`store->name`) — v1.0
- Cloud storage, S3 — local only
- File watching, permissions — v1.0+
- Binary file transformation (load/save yes, transform no)
- FileReference content caching (always resolve fresh from disk)

## Requirements

### FileReference Type

**Last updated:** 2026-02-23
**Test:** `npx vitest run massivoto-interpreter/src/evaluator/file-reference.spec.ts`
**Progress:** 3/3 (100%)

- ✅ R-FILE-01: Define `FileReference` type in `@massivoto/kit` (shared between evaluator and commands):
  ```typescript
  interface FileReference {
    type: 'file-ref'
    relativePath: string   // "images/hero.png" (without ~/ prefix)
    absolutePath: string   // "/home/user/project/images/hero.png"
  }
  ```
  FileReference is a plain object, not a class. No methods. Commands use `absolutePath` to read/write.

- ✅ R-FILE-02: Define `isFileReference(value: unknown): value is FileReference` type guard.
  Commands use this to detect file references in their args vs regular strings.

- ✅ R-FILE-03: Define `resolveFilePath(relativePath: string, projectRoot: string): string` utility.
  Strips `~/` prefix if present, joins with `projectRoot` using `path.resolve()`.
  Validates the resolved path is still under `projectRoot` (prevent escape via symlinks).

### Evaluator — File and Glob Resolution

**Last updated:** 2026-02-23
**Test:** `npx vitest run massivoto-interpreter/src/evaluator/file-evaluator.spec.ts`
**Progress:** 5/5 (100%)

- ✅ R-FILE-21: Add `literal-file` case to `ExpressionEvaluator.evaluate()` (evaluators.ts line 52):
  ```typescript
  case 'literal-file':
    return this.evaluateFileLiteral(expr, context)
  ```
  Produces a `FileReference` with `relativePath` (stripped `~/`) and `absolutePath` (resolved against `context.fileSystem.projectRoot`).

- ✅ R-FILE-22: Add `literal-glob` case to `ExpressionEvaluator.evaluate()`:
  ```typescript
  case 'literal-glob':
    return this.evaluateGlobLiteral(expr, context)
  ```
  Uses `fast-glob` to expand the pattern against the project root.
  Returns `FileReference[]` — one per matching file, sorted alphabetically.
  Empty glob match returns `[]` (not an error).

- ✅ R-FILE-23: Glob expansion must use `projectRoot` as the `cwd` option for `fast-glob`.
  The glob pattern has `~/` stripped before passing to `fast-glob`.
  Example: `~/images/races/*.jpg` → `fast-glob('images/races/*.jpg', { cwd: projectRoot })`.

- ✅ R-FILE-24: If `context.fileSystem` or `context.fileSystem.projectRoot` is undefined,
  throw an `EvaluationError`: `"File access requires a projectRoot. Configure it in the runner."`
  This makes it clear that file features need a properly configured runner.

- ✅ R-FILE-25: Security: the evaluator must verify that every resolved `absolutePath` is
  within `projectRoot` (no symlink escape). Use `path.resolve()` and check `.startsWith(projectRoot)`.
  Throw `EvaluationError` if path escapes.

### Path Pipe

**Last updated:** 2026-02-23
**Test:** `npx vitest run massivoto-interpreter/src/pipe-registry/path-pipe.spec.ts`
**Progress:** 4/4 (100%)

- ✅ R-FILE-41: Add `PathPipe` to `CorePipesBundle` (id=`'path'`):
  ```typescript
  class PathPipe implements PipeFunction {
    id = 'path'
    async execute(input: any): Promise<string> {
      // input must be an array of segments
      // join with '/', normalize, reject '..'
    }
  }
  ```

- ✅ R-FILE-42: `|path` behavior:
  - Input: array of string segments → join with `/`
  - Empty segments skipped: `["images", "", "hero.png"]` → `"images/hero.png"`
  - Double slashes normalized: `["images/", "/hero.png"]` → `"images/hero.png"`
  - Non-strings coerced: `[123, true, "hero.png"]` → `"123/true/hero.png"`
  - Empty array → `""`

- ✅ R-FILE-43: Security: `|path` rejects `..` in any segment after coercion.
  Throws: `"Path pipe rejects '..' segments (security)"`.

- ✅ R-FILE-44: `|path` does NOT prepend `~/` or resolve against projectRoot.
  It produces a relative path string. The command or evaluator handles resolution.
  This keeps the pipe pure (no I/O, no context dependency).

### Save Command

**Last updated:** 2026-02-23
**Test:** `npx vitest run massivoto-interpreter/src/core-handlers/file/file-save.spec.ts`
**Progress:** 5/5 (100%)

- ✅ R-FILE-61: Create `FileSaveHandler` extending `BaseCommandHandler<string>`:
  - ID: `@file/save`
  - Args: `data` (content to write), `file` (destination path)
  - `file` arg accepts: string path, FileReference, or `~/` prefixed string
  - Returns `ActionResult<string>` with the absolute path written to

- ✅ R-FILE-62: Data serialization by type:
  - `string` → write as UTF-8 text
  - `object` / `array` → `JSON.stringify(data, null, 2)` + write as UTF-8
  - `Buffer` / `Uint8Array` → write as binary
  - `FileReference` → copy file from source to destination (binary copy)

- ✅ R-FILE-63: Parent directory creation: if the target directory doesn't exist,
  create it recursively (`fs.mkdir` with `{ recursive: true }`).

- ✅ R-FILE-64: Path resolution for `file` arg:
  - If `FileReference`: use `absolutePath` directly
  - If string starting with `~/`: strip prefix, resolve against `context.fileSystem.projectRoot`
  - If relative string (from `|path` pipe): resolve against `context.fileSystem.projectRoot`
  - If absolute string: use directly (for escape hatch, but warn in docs)

- ✅ R-FILE-65: Register `@file/save` in `CoreHandlersBundle` (or `register-handlers.ts`).
  Remove or deprecate the MCP-based `@file/write` handler.

### ExecutionContext — FileSystem Configuration

**Last updated:** 2026-02-23
**Test:** `npx vitest run platform/packages/kit/src/domain/execution-context/`
**Progress:** 3/3 (100%)

- ✅ R-FILE-81: Add `fileSystem` field to `ExecutionContext`:
  ```typescript
  interface ExecutionContext {
    // ... existing fields ...
    fileSystem?: {
      projectRoot: string  // absolute path to project root
    }
  }
  ```
  Optional because not all runners need file access (e.g. SaaS runner may use cloud storage).

- ✅ R-FILE-82: Update `LocalRunner` to set `fileSystem.projectRoot` when creating the context.
  The project root should be configurable (constructor arg or option), defaulting to `process.cwd()`.

- ✅ R-FILE-83: Update `createEmptyExecutionContext()` to accept an optional `fileSystem` config.
  For tests, this allows setting a temp directory as `projectRoot`.

## Dependencies

- **Depends on:**
  - [file-path-parser.done.prd.md](../../../massivoto-interpreter/src/parser/file/file-path-parser.done.prd.md) (IMPLEMENTED) — provides FileLiteralNode, GlobLiteralNode AST types
  - [core-pipes.done.prd.md](../../../massivoto-interpreter/src/pipe-registry/core-pipes.done.prd.md) (IMPLEMENTED) — provides CorePipesBundle pattern
  - [reserved-args-precedence.done.prd.md](../../../massivoto-interpreter/src/parser/filter-pattern/reserved-args-precedence.done.prd.md) (IMPLEMENTED) — forEach + collect for `@file/save` in a loop

- **Blocks:**
  - The Race Was Great image pipeline (v0.6 target)
  - `@ai/prompt/reverseImage` (needs `image=~/f1.png` to resolve)
  - `@ai/generateImage` (needs to save generated images)

- **External dependency to add:**
  - `fast-glob` (^3.3.0) — glob expansion library

## Open Questions

- [x] FileReference vs inline content? → **FileReference** (lazy, commands load on demand)
- [x] Glob library? → **`fast-glob`**
- [x] Command namespace `@core/files/save` vs `@file/save`? → **`@file/save`** (matches existing)
- [x] `~/` in FileReference? → **Stripped** (evaluator resolves to absolute)
- [x] Should `@file/save` support overwrite protection (e.g. `overwrite=false` arg)? → **No** for v0.6, files are always overwritten
- [x] Should `@file/save` return the file size in the result? → **No** for v0.6, nice to have for later
- [ ] How should binary data (images from AI generation) be represented in the scope? → TBD when `@ai/generateImage` is implemented

## Acceptance Criteria

### Theme

> **Theme:** Formula One Race Automation
>
> Generating F1 race images with AI, saving them to organized folders, iterating over
> race photos with globs. Reused from: [reserved-args-precedence.done.prd.md](../../../massivoto-interpreter/src/parser/filter-pattern/reserved-args-precedence.done.prd.md)

### Criteria

**File evaluation:**

- [x] AC-FILE-01: Given an OTO program with `image=~/photos/monaco.png` and `projectRoot=/home/nik/f1-project`,
      when the evaluator resolves the argument, then the command receives a FileReference
      with `relativePath="photos/monaco.png"` and `absolutePath="/home/nik/f1-project/photos/monaco.png"`

- [x] AC-FILE-02: Given `~/photos/races/*.jpg` matching 3 files (`lap1.jpg`, `overtake.jpg`, `podium.jpg`),
      when the evaluator resolves the glob, then it returns an array of 3 FileReference objects sorted alphabetically

- [x] AC-FILE-03: Given `~/photos/empty-folder/*.jpg` matching 0 files,
      when the evaluator resolves the glob, then it returns an empty array `[]` (not an error)

- [x] AC-FILE-04: Given no `fileSystem.projectRoot` configured in the runner,
      when `~/photos/monaco.png` is evaluated, then the evaluator throws
      `"File access requires a projectRoot. Configure it in the runner."`

**Path pipe:**

- [x] AC-FILE-05: Given `{["drivers", "max", "helmet.png"]|path}`,
      when the pipe evaluates, then the result is the string `"drivers/max/helmet.png"`

- [x] AC-FILE-06: Given `{["output", "..", "secrets"]|path}`,
      when the pipe evaluates, then it throws `"Path pipe rejects '..' segments (security)"`

**Save command:**

- [x] AC-FILE-07: Given Max's helmet description `"Red Bull racing helmet with #1"` as a string,
      when `@file/save data=description file={["drivers", "max", "bio.txt"]|path}` executes,
      then the file `<projectRoot>/drivers/max/bio.txt` exists with that text content

- [x] AC-FILE-08: Given race results as an object `{ winner: "Max", laps: 53 }`,
      when `@file/save data=results file=~/output/race.json` executes,
      then the file contains pretty-printed JSON: `{ "winner": "Max", "laps": 53 }`

- [x] AC-FILE-09: Given a save to `~/output/deep/nested/result.txt` where `output/deep/nested/` doesn't exist,
      when the command executes, then parent directories are created automatically

- [x] AC-FILE-10: Given `@file/save file={["selection/", "f1-", $index, ".png"]|path} forEach=selectedImages->image`,
      when executed with 3 selected images, then 3 files are saved:
      `selection/f1-0.png`, `selection/f1-1.png`, `selection/f1-2.png`

**Integration:**

- [x] AC-FILE-11: Given `@block/begin forEach=~/photos/races/*.jpg -> photo` with 2 matching photos,
      when the block executes, then each `photo` in the loop is a FileReference with a valid absolutePath

- [x] AC-FILE-12: Given a full pipeline: glob photos → describe each → save descriptions,
      when the pipeline runs end to end, then description files exist on disk matching the photo names

**General:**
- [x] All automated tests pass
- [x] Edge cases covered in `*.edge.spec.ts` files

## Implementation Notes

### File Structure

```
massivoto-interpreter/src/
├── evaluator/
│   ├── evaluators.ts                    # UPDATE: add literal-file and literal-glob cases
│   ├── file-evaluator.spec.ts           # NEW: file/glob evaluation tests
│   └── file-evaluator.edge.spec.ts      # NEW: edge cases (missing projectRoot, symlinks)
├── pipe-registry/
│   ├── core-pipes-bundle.ts             # UPDATE: add PathPipe
│   ├── path-pipe.spec.ts                # NEW: path pipe tests
│   └── path-pipe.edge.spec.ts           # NEW: edge cases (.., empty, coercion)
├── core-handlers/
│   ├── file/
│   │   ├── file-save.handler.ts         # NEW: @file/save command
│   │   ├── file-save.spec.ts            # NEW: save command tests
│   │   └── file-save.edge.spec.ts       # NEW: edge cases (missing dirs, types)
│   └── mcp/client/filesystem/           # DEPRECATE: @file/write (MCP-based)
├── handlers/
│   └── register-handlers.ts             # UPDATE: register @file/save, remove @file/write

platform/packages/kit/src/domain/
├── execution-context/
│   └── execution-context.ts             # UPDATE: add fileSystem field
├── file-reference.ts                    # NEW: FileReference type + utilities
```

### Implementation Order

1. `FileReference` type in kit (no dependencies)
2. `ExecutionContext.fileSystem` field (depends on 1)
3. `|path` pipe (no dependencies, pure function)
4. Evaluator file/glob cases (depends on 1, 2)
5. `@file/save` command (depends on 1, 2)
6. Integration tests (depends on all above)
