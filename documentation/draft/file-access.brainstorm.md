# File Access Brainstorm

**Date:** 2026-02-16
**Participants:** Product Owner, Claude (AI facilitator)
**Context:** Massivoto v0.6 — enabling local file access for "The Race Was Great" (F1 SaaS) image pipeline

---

## 1. Product Role

**What it is:** A file access subsystem for Massivoto's ExecutionContext that allows OTO programs to read, write, and glob local files through the existing expression system, with files as first-class AST nodes.

**What it is NOT:**
- Not a storage product or service on its own
- Not a sync engine (no real-time replication between local/cloud)
- Not a replacement for `data` or `scope` (those stay as-is for program variables)
- Not a multi-store solution (deferred to v1.0)

**Decision:** Keep the OTO syntax dead simple and push complexity into the runner configuration. The OTO author shouldn't care about underlying storage implementation.

**Rationale:** Separation of concerns — language syntax is about expressiveness and readability, runner config is about infrastructure.

---

## 2. Target Audience

**v0.6:** Solo user, local runner, building The Race Was Great. Storage needs = files + default store. No multi-store, no SaaS sync.

**v1.0+:** Team builders needing multi-store and cloud file sync.

**Permanent constraint:** LLM-friendly syntax — OTO programs must be unambiguous for AI generation and consumption.

**Decision:** Design for the solo local user. Multi-store syntax is designed but deferred.

**Rationale:** Only one user before v1.0. Ship what's needed for the March 6th deadline.

---

## 3. Core Problem

**Problem:** OTO programs cannot read, write, or navigate local files. The runtime has `data`, `scope`, `env`, and `store` — but no filesystem access.

**Consequences if we do nothing:**
- The Race Was Great image pipeline is impossible (load racing photos, generate heroes, save results, organize driver portraits)
- Every file interaction requires workarounds outside OTO (manual scripts, external tools)
- OTO can't be a self-contained automation language — it leaks to external tooling for anything file-related
- March 6th deadline at risk

**Decision:** Build local file access as the #1 priority for v0.6.

**Rationale:** Hard blocker for the only real use case. No workaround exists within OTO.

---

## 4. Unique Value Proposition

**UVP:** Files as first-class citizens in OTO — safe, readable, predictable. "AI under control."

**Alternative considered:** Shell escape with `@utils/exec cmd="cat ./images/hero.png"` — rejected as unsafe, platform-dependent, unreadable.

**Decision:** File access must be language-level, not shell-level.

**Rationale:** Safety, readability, and predictability are core Massivoto values. Shell escapes violate all three.

---

## 5. Acquisition Strategy

N/A — subsystem, not a standalone product.

---

## 6. Functional Scope

### IN scope for v0.6

| Capability | Detail |
|-----------|--------|
| `~/path` FileNode syntax | Static file reference in expressions and arguments |
| `~/pattern` GlobNode syntax | Glob pattern producing array of FileNodes |
| `\|path` pipe | Dynamic path construction from array segments |
| `@core/files/save` | Write data to a file |
| Inline file resolution | `~/` resolves to actual file content, not just a path string |

### EXPLICITLY out of scope

| Capability | Why |
|-----------|-----|
| Multi-store (`store->name`) | Not needed for v0.6, design is documented |
| `@store/declare` | Depends on multi-store |
| S3 / cloud storage | Local only |
| File sync / git | Not needed |
| `@core/files/cd` | Stateful working directory + forEach/goto = subtle bugs |
| `@core/files/load` | Replaced by inline `~/` resolution |
| `@core/files/ls` | Replaced by GlobNode `~/images/*` |
| `@core/files/delete` | Not needed for TRWG |
| `@core/files/move` | Not needed for TRWG |
| File watching / live reload | v1.0+ |
| File permissions / ACL | v1.0+ SaaS concern |
| Binary file manipulation | Load/save yes, transform no |

**Decision:** load, save concept (via inline resolution + save command), glob via syntax, no cd/delete/move.

**Rationale:** Minimal feature set that unblocks the image pipeline. Every cut item either has a workaround or isn't needed for TRWG.

---

## 7. Core Features

### Feature: `~/` File Path Token (FileNode / GlobNode)

**Capability:** `~/path` produces a FileNode (single file reference). `~/path/*.ext` produces a GlobNode (pattern, resolves to array of FileNodes). Both are distinct AST node types determined at parse time by the presence of `*`.

The `~/` two-character token triggers a greedy lexer mode that consumes until whitespace, `}`, or `"`. Allowed characters: `a-zA-Z0-9`, `*` (glob), `-`, `_`, `.`, `/`.

**Acceptance Criteria:**
- Given a bare argument `image=~/images/hero.png`, When the parser tokenizes it, Then it produces a FileNode with path `images/hero.png`
- Given an expression `{~/data/race-results.json}`, When evaluated, Then it resolves to the file content at `<project-root>/data/race-results.json`
- Given a path with dots `~/output/report.final.json`, When parsed, Then dots are treated as literal path characters, not property access
- Given `~/images/*.png` (wildcard), When parsed, Then AST contains a GlobNode with pattern `images/*.png`
- Given a GlobNode, When evaluated, Then it resolves to an array of FileNodes matching the pattern // TODO AI: not sure for this one, don't understand 
- Given a GlobNode matching 0 files, When evaluated, Then result is an empty array (not an error)
- Given a GlobNode used where a single FileNode is expected, When validated, Then a clear type error is raised
- Given `..` anywhere in the path, When parsed, Then the parser rejects it immediately (security)

**Test Approach:** Parser unit tests for FileNode vs GlobNode detection. Evaluator integration tests with temp directory for glob expansion. Security tests for `..` rejection.

---

### Feature: Inline File Resolution

**Capability:** When `~/path` appears as a command argument, the evaluator resolves it to actual file content (always binary), not just a path string. Commands receive the file directly.

```oto
@ai/describe image=~/images/hero.png output=description
@ai/generate prompt="Analyze this: {~/data/race-stats.json}" output=analysis
```

**Acceptance Criteria:**
- Given `image=~/images/hero.png`, When the evaluator resolves the argument, Then the command receives the file content (binary), not the string `"images/hero.png"`
- Given `~/nonexistent.png` as an argument, When evaluated, Then a clear error with the full resolved path is returned before the command executes
- Given a write-then-read sequence, When the same path is referenced twice, Then the second resolution reads fresh from disk (no caching)

**Open design question:** `~/` produces a FileReference object. Commands that need content use it as binary. Commands that need the path (like `@core/files/save`) use the path string. The framework handles extraction based on the command's argument declaration.

**Test Approach:** Integration tests with temp files. Pass `~/` reference to a mock command, verify it receives binary content. Test missing file error. Test no-cache behavior.

---

### Feature: `|path` Pipe

**Capability:** Joins an array of string segments into a `/`-separated file path. Normalizes double slashes. Non-string segments are coerced to strings then filtered for security (`..` rejected).

```oto
@core/files/save data=description path={["output", driver.name, "description.txt"]|path}
```

**Acceptance Criteria:**
- Given `{["images", "hero.png"]|path}`, When evaluated, Then result is `"images/hero.png"`
- Given `{["images", "", "hero.png"]|path}`, When evaluated, Then empty segments are skipped, result is `"images/hero.png"`
- Given `{["images/", "/hero.png"]|path}`, When evaluated, Then double slashes are normalized, result is `"images/hero.png"`
- Given an empty array `{[]|path}`, When evaluated, Then result is `""`
- Given `{[123, true, "hero.png"]|path}`, When evaluated, Then segments are coerced to strings: `"123/true/hero.png"`
- Given `{["images", "..", "secrets"]|path}`, When evaluated, Then `..` segment is rejected (security error)

**Test Approach:** Unit tests on the pipe function. Pure transformation, no I/O.

---

### Feature: `@core/files/save`

**Capability:** Writes data to a file on the local filesystem. Creates parent directories if needed. Serializes JSON objects automatically.

```oto
@core/files/save data=results path=~/output/results.json
@core/files/save data=heroImage path={["output", driver.name, "hero.png"]|path}
```

**Acceptance Criteria:**
- Given an object in `data.results`, When `@core/files/save data=results path=~/output/results.json`, Then the file exists with JSON content matching the object
- Given a string, When saved to a `.txt` path, Then file contains the raw string
- Given binary data (image), When saved, Then file contains the raw binary
- Given a path with non-existent parent dirs `~/output/deep/nested/file.json`, When saved, Then parent directories are created automatically
- Given an existing file at the target path, When saved, Then the file is overwritten

**Test Approach:** Integration tests with temp directory. Verify file content after save. Test directory creation. Test overwrite behavior.

---

## 8. Differentiating Features

### Files as Language-Level Primitives

Most automation tools (n8n, Zapier, Make) treat files as opaque blobs passed between steps. In OTO, files are **typed AST nodes**. The parser knows a FileNode from a GlobNode at parse time. Commands can type-check. Errors are caught early.

### Glob as Flow Control

```oto
@start/forEach item="photo" of=~/images/races/*.jpg
  @ai/describe image={photo} output=description
@end/forEach
```

The glob IS the iteration source. No intermediate "list files" step. Pattern matching drives the flow directly. Shell-level power with language-level safety.

### Considered and Rejected: Inline forEach Glob

```oto
@ai/describe image={photo} forEach=~/images/races/*.jpg->photo output=description
```

Rejected because: precedence nightmare (`~/` greedy lexer vs `->` mapper vs `*` glob), readability loss, vague error messages. The explicit `@start/forEach` block is OTO's strength.

---

## 9. Version Assignment

| Feature | Version | Rationale |
|---------|---------|-----------|
| `~/` FileNode | v0.6 | Blocker for TRWG image pipeline |
| `~/` GlobNode | v0.6 | Same parser work, forEach over images is core TRWG use case |
| Inline file resolution | v0.6 | Without this, `~/` is just a path string |
| `\|path` pipe | v0.6 | Needed for dynamic paths in forEach, trivial to implement |
| `@core/files/save` | v0.6 | Must save generated images/results |
| `store->name` multi-store | v1.0 | Not needed for TRWG, design is documented |
| `@store/declare` | v1.0 | Depends on multi-store |

---

## 10. Critical Edge Cases

| Edge Case | Decision | Rationale |
|-----------|----------|-----------|
| `..` in paths | Rejected at parse time | Security — prevent path traversal before evaluation |
| Massive glob (thousands of files) | User's responsibility for v0.6 | Note for v1.0: memory limits/guards |
| Path characters | Latin only: `a-zA-Z0-9`, `*`, `-`, `_`, `.`, `/`. No spaces. | Keeps greedy lexer simple, avoids ambiguity |
| FileNode pointing to directory | Clear error: "Expected a file, got a directory" | Explicit typing prevents misuse |
| Empty glob result in forEach | Silent success, body never executes | Consistent with empty array iteration |
| File type detection | Always binary | Commands handle interpretation, file layer doesn't guess |
| FileNode caching | No cache, always resolve fresh from disk | Correctness after write-then-read sequences |
| `\|path` with non-strings | Coerce to string, then filter for security | Reject `..` segments after coercion |

---

## 11. Non-Functional Constraints

| Constraint | Requirement |
|------------|-------------|
| Security | Paths sandboxed to project root. `..` rejected at parse time. |
| Performance | File loading is async I/O. Glob expansion resolves paths first, loads content lazily when commands need it. |
| Portability | `~/` uses `/` as separator regardless of OS. Runner handles OS-level translation. |
| Cost | File operations have a base cost (for v1.0 cost tracking). Large globs = many file ops = high cost. |
| Error quality | File errors include full resolved path and are LLM-readable. |

---

## 12. External Dependencies

| Dependency | Risk |
|------------|------|
| Node.js `fs` module | Zero — built-in, stable |
| Node.js `path` module | Zero — built-in, handles OS differences |
| Glob library (e.g. `fast-glob`) | Low — small, well-maintained, need to pick one |
| Project root from runner config | Zero — already exists in LocalRunner |

No cloud APIs, no databases, no network calls.

---

## 13. Major Risks

| Risk | Level | Mitigation |
|------|-------|------------|
| Parser complexity (FileNode, GlobNode, greedy lexer, `..` rejection) | Medium | Parser is well-tested in this codebase. TDD approach. |
| March 6th deadline | Medium | Feature set is minimal (5 features). No scope creep. |
| Inline resolution performance (large globs) | Low for v0.6 | Dozens of images, not thousands. Lazy loading for v1.0. |
| `~/` syntax lock-in | Low | Decisions are sensible. CLAUDE.md: "we don't care about backward compatibility." |

---

## 14. Priority

**P1 — Ship before anything else.**

File access is the hard blocker for The Race Was Great. Grid applet, licensing, parser enhancements — all lower priority. Grid applet would be #2 (human validation of generated images), but useless without files to validate.

---

## Multi-Store Design Decisions (Deferred to v1.0)

These decisions were made during the brainstorm but are NOT in scope for v0.6. Documented here for future reference.

### Rejected Proposals

**`@store/select` command:** Stateful store selection — too hard to track with gotos, requires declaring in too many places. No-go.

**`store` / `stores` namespaces:** `store` for default, `stores.name` for named. Rejected: one-character difference is typo-prone, no type visibility.

**Bare declared names:** `@store/declare name=vector id=vector123` then `vector.images.john`. Rejected: collides with `data` namespace — `vector` could be a data variable or a store.

### Accepted Design

**`store.x` for default store + `store->name.x` for named stores:**

```oto
# Default store (backward compatible)
store.customers.john.name

# Named stores with -> selector
@store/declare name=vector id=vector123
@store/declare name=analytics id=analytics123

store->vector.embeddings
store->analytics.events.click
```

- `->` has higher precedence than `.`: `(store->vector).embeddings`
- `->` after `store` (reserved namespace) = store selection
- `->` after regular identifier = mapper (existing behavior)
- `@store/declare` registers named stores configured externally
- `@store/` package commands and `store.` namespace coexist (different syntactic positions: `@` prefix vs expression)

---

## Gaps / Open Questions

1. **FileReference object shape:** What does the evaluator produce for a FileNode? `{ path, content, type }` or something else? Commands need to distinguish "I want the content" from "I want the path string."
2. **Glob library selection:** `fast-glob` is the likely choice, to be confirmed during implementation.
3. **`@core/files/save` path argument:** Does it accept `~/` (FileNode) or a string path? If FileNode, the evaluator produces a path reference, not file content. Need to define argument type semantics.
4. **GlobNode lazy vs eager:** Does glob expansion load all file contents immediately, or just resolve paths and load on demand? Lazy is better for performance but adds complexity.
5. **Error format for file operations:** Must be LLM-readable per ROADMAP. Exact format TBD.

---

## Next Steps

1. Write a PRD (`file-access.wip.prd.md`) from this brainstorm with implementation tasks
   2. in fact, starts with the parser prd first, in massivoto-interpreter
2. Update `data-access.wip.md` to reference the decisions made here
3. Implement with TDD: parser first (FileNode, GlobNode), then evaluator, then pipe, then save command
4. Update ROADMAP to reflect file access as v0.6 P1
