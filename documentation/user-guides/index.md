# User Guides

This is the entry point to OTO documentation. The guides assume no prior knowledge of the language. Read them in order for the smoothest learning curve, or jump to a topic you need.

## Beginner path

1. **[get-started.md](./get-started.md)** — install Massivoto, run your first `.oto` program, learn the CLI.
2. **[commands.md](./commands.md)** — anatomy of `@package/command arg=value output=name`. Reserved vs regular args.
3. **[variables-and-expressions.md](./variables-and-expressions.md)** — bare strings vs braced expressions, scope chain, member access. The single most important syntax rule.
4. **[pipes.md](./pipes.md)** — transform data inline with `|filter`, `|map`, `|join`, etc. The 11 core pipes.
5. **[iteration.md](./iteration.md)** — `forEach=src->item`, `collect=`, `retry=`, the precedence rules.
6. **[system-variables.md](./system-variables.md)** — `$index`, `$count`, `$first`, `$last`, `$odd`, `$even` inside loops.
7. **[conditions.md](./conditions.md)** — `if=` for branching. Truthiness, comparisons, logical operators.
8. **[files-and-globs.md](./files-and-globs.md)** — `~/path` literals, glob expansion, `@file/save`.
9. **[ai-actions.md](./ai-actions.md)** — `@ai/text`, `@ai/image/generate`, providers and credentials.
10. **[human-validation.md](./human-validation.md)** — `@human/confirm`, `@human/grid`, applets.
11. **[security.md](./security.md)** — secrets, env vars, what not to put in a `.oto` file.

## What this section is *not*

- **Not the formal specification.** For exact grammar and semantics, see [`../dsl-specification/dsl-0.5.md`](../dsl-specification/dsl-0.5.md).
- **Not a reference manual.** Each guide explains *how to think* about a topic. The reference is the source code and architecture documents.
- **Not a tutorial for advanced features.** Crawling, flow control, blocks, RAG, and custom handlers will live in an intermediate section once the language stabilizes.

## Conventions

- All examples use DSL 0.5 — the version implemented today.
- Each guide ends with a **References** section linking to specifications, architecture documents, source files, and feature PRDs. Use these when you want to go deeper.
- File paths are written from the documentation directory.

## Glossary (for cross-reference)

| Term | Where it is defined |
|------|---------------------|
| **OTO** | This index |
| **Action / Command** | [commands.md](./commands.md) |
| **Reserved arg** | [commands.md](./commands.md) |
| **Output target / binding** | [commands.md](./commands.md), [variables-and-expressions.md](./variables-and-expressions.md) |
| **Bare string vs braced expression** | [variables-and-expressions.md](./variables-and-expressions.md) |
| **Pipe** | [pipes.md](./pipes.md) |
| **Mapper `->`** | [iteration.md](./iteration.md) |
| **System variable** | [system-variables.md](./system-variables.md) |
| **File reference** | [files-and-globs.md](./files-and-globs.md) |
| **Applet** | [human-validation.md](./human-validation.md) |
| **Provider / env var** | [ai-actions.md](./ai-actions.md), [security.md](./security.md) |

## Where to next (intermediate, not yet written)

The following topics deserve their own guides at the intermediate level:

- **Blocks** — `@block/begin ... @block/end`, scope nesting
- **Flow control** — `@flow/goto`, `@flow/exit`, `@flow/return`, labels
- **Crawling** — `@crawl/session/open` and the six related commands
- **RAG and embeddings** — `@ai/ragify` (when shipped)
- **Custom handlers** — writing your own `@my-package/command` in TypeScript
- **Custom pipes** — adding to the pipe registry
- **Stores and persistence** — the `&` sigil for databases and external storage (in design)
- **Cost management** — pre-flight estimation, budgets, hard caps
- **Testing OTO programs** — `OtoTestRunner`, integration vs unit tests

If you need any of these now, start from the relevant architecture document or roadmap entry.

## References

- **Top-level architecture:** [`../../../root.archi.md`](../../../root.archi.md) — system overview, module layout
- **DSL specification:** [`../dsl-specification/dsl-0.5.md`](../dsl-specification/dsl-0.5.md) — formal grammar
- **Roadmap:** [`../../../ROADMAP.md`](../../../ROADMAP.md) — what is next, version targets
- **Runtime architecture:** [`../../packages/runtime/runtime.archi.md`](../../packages/runtime/runtime.archi.md) — interpreter pipeline, execution context
