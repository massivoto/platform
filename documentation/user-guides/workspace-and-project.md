# Workspace and Project

OTO programs read and write files relative to a **project root**. When you have many projects on disk (several clients, several environments, several research branches), the workspace mechanism lets you switch between them without editing the program — you just tell the runner which project this run targets.

This guide covers:

- the `<workspaceRoot>/<project>/` convention,
- the three sources of `_project`,
- how to read `{_project}` from a program,
- the validation errors you will see when configuration is wrong,
- the immutability rule that protects `_project` (and the future `_env`, `_vault`, `_network` family).

## The convention

A workspace is a flat directory whose children are project folders:

```
<workspaceRoot>/
├── acme-corp/
│   ├── brief.md
│   ├── charte.pptx
│   └── deck.pptx
├── beta-industries/
│   ├── brief.md
│   └── deck.pptx
└── gamma-group/
    └── brief.md
```

When `_project=acme-corp`, every `~/brief.md` in the program resolves to `<workspaceRoot>/acme-corp/brief.md`. Switch to `_project=beta-industries` and the same program targets `<workspaceRoot>/beta-industries/brief.md`. No code changes.

`<workspaceRoot>` is `<cwd>/workspace` by default — the convention recommended for developers who clone the platform repo. Override it with the env var `MASSIVOTO_WORKSPACE_ROOT` if you keep your workspace elsewhere (`/data/clients/`, `~/work/decks/`, ...).

## The three sources of `_project`

The runner picks `_project` from the first source that defines it:

| Priority | Source | Example |
|----------|--------|---------|
| 1 (highest) | CLI flag | `oto run pipeline.oto --project acme-corp` |
| 2 | Env var `MASSIVOTO_PROJECT` | `.env` containing `MASSIVOTO_PROJECT=acme-corp` |
| 3 | (none) | `_project` stays undefined, `projectRoot = process.cwd()` |

The CLI flag has a short form `-p`:

```bash
oto run pipeline.oto -p beta-industries
```

The flag is documented in `oto run --help`.

### Émilie's typical day

Émilie has three clients. Her `.env` pins her main one:

```
# .env
MASSIVOTO_PROJECT=acme-corp
```

By default, every `oto run` she fires targets Acme. When her boss asks for a quick Beta update, she overrides for one run:

```bash
oto run weekly-update.oto --project beta-industries
```

…and her terminal prints:

```
[oto] workspace: project=beta-industries, root=/home/emilie/dev/massivoto-platform/workspace/beta-industries
```

The next run, with no flag, goes back to Acme — `.env` is still the source of truth.

## Reading `{_project}` from a program

Once the runner has resolved `_project`, the value is exposed at the root of the OTO scope chain. Read it like any other identifier:

```oto
@utils/log message="Building deck for {_project}"
@file/save data=summary file=~/reports/{_project}-summary.md
```

Branching on whether a project is configured is a standard pattern — the identifier resolves to `undefined` when nothing is set, so:

```oto
@utils/log message="No project, falling back to cwd" if={!_project}
@utils/log message="Building deck for {_project}" if={_project}
```

`_project` is a regular string. It is not a magic namespace.

## Validation errors

The runner validates the workspace configuration **at boot, before parsing the program**. The fast-fail saves AI tokens and surfaces a clear message early.

### Path traversal

```bash
MASSIVOTO_PROJECT=../../etc/passwd oto run pipeline.oto
```

```
WorkspaceConfigError: Invalid workspace project "../../etc/passwd": resolved path is outside the workspace root (resolved path: /etc/passwd)
```

The check rejects any value whose resolved path falls outside `<workspaceRoot>`. This is independent from the second-line check (`absolutePath.startsWith(projectRoot)`) that protects against `~/../` escape attempts inside an OTO program.

### Missing directory

```bash
oto run pipeline.oto --project delta-systems
```

```
WorkspaceConfigError: Invalid workspace project "delta-systems": workspace project directory not found (resolved path: /home/emilie/.../workspace/delta-systems)
```

The runner does not auto-create the directory. Create it explicitly (`mkdir -p`) or fix the typo.

### Wrong target type

If `<workspaceRoot>/<project>` exists but is not a directory (e.g. a stray file), validation rejects the configuration with `resolved path is not a directory`.

## Immutability — the `_*` convention

`_project` is **read-only** from the OTO program. Trying to reassign it produces an `EvaluationError`:

```oto
@utils/set value="other-client" output=_project
```

```
EvaluationError: _project is read-only and cannot be reassigned. Set MASSIVOTO_PROJECT in .env or use --project on the CLI.
```

This applies to `output=_project` on any handler, on `output=scope._project`, and on `collect=_project`. The check runs in the interpreter's output resolver, so future handlers cannot bypass it.

The rule generalizes: **any identifier starting with `_` is reserved for the runner**. Future system variables (`_env`, `_vault`, `_network`) will follow the same convention — populated by the runner, readable by the program, never writable from inside.

This is distinct from the `$`-sigil family (`$index`, `$first`, `$last`, ...) used by `forEach` iteration. `$`-prefixed names live in their own AST node (`SystemVariableNode`); `_`-prefixed names are ordinary identifiers placed into the root scope by the runner.

## Boot logs

The runner prints one line on stderr at the start of every run so you know what `~/` will resolve to:

| `_project` state | Log line |
|------------------|----------|
| Set | `[oto] workspace: project=<name>, root=<absolutePath>` |
| Unset | `[oto] workspace: no _project set, using cwd as projectRoot` |

If you pipe `oto`'s stdout to another tool, the workspace log goes to stderr and does not pollute the JSON output.

## References

- **CLI:** `oto run --help` lists the `--project` / `-p` flag.
- **Other guides:**
  - [files-and-globs.md](./files-and-globs.md) — how `~/` is evaluated against `projectRoot`.
  - [security.md](./security.md) — second-line defense (`startsWith(projectRoot)`).
- **PRD:** `features/workspace/workspace.wip.prd.md` — full requirement list, decision log, acceptance criteria.
- **Source:**
  - `massivoto-platform/packages/runtime/src/runner/workspace-config.ts` — `resolveWorkspaceConfig()`.
  - `massivoto-platform/packages/runtime/src/errors/workspace-config-error.ts` — `WorkspaceConfigError`.
  - `massivoto-interpreter/src/evaluator/system-variables.ts` — read-only enforcement on `_*`.
