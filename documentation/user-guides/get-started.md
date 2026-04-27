# Get Started

This guide walks you from zero to a running OTO program in under five minutes. No prior experience with the OTO language is required, but you should be comfortable with a terminal and have Node.js installed.

## What is OTO?

OTO is the **Massivoto Automation Programming Language (APL)**. You write small `.oto` files that chain together commands like:

```oto
@utils/set input="Emma" output=user
@utils/log message=user
```

Each line is one command. Commands write their result into a named variable (`output=...`). Later commands read those variables. The order is top-to-bottom, like a script.

OTO is designed to be:

- **AI-friendly** — easy for an LLM to generate
- **Human-readable** — no boilerplate, no syntax tax
- **Reproducible** — the file is the source of truth; no hidden GUI clicks
- **Mixable** — combine deterministic commands (`@file/save`, `@crawl/page`) with AI calls (`@ai/text`) and human checkpoints (`@human/confirm`)

## Install

Massivoto is a Yarn workspaces monorepo. From the `massivoto-platform/` directory:

```bash
yarn install
yarn build
```

The CLI binary is `oto`. After build, the binary lives at `packages/runtime/bin/oto.js`. You can either invoke it directly or link it globally during development:

```bash
cd packages/runtime
yarn link
oto --help
```

## Your first program

Create a file `hello.oto` anywhere:

```oto
@utils/set input="world" output=name
@utils/log message=name
```

Run it:

```bash
oto run hello.oto
```

Expected output: the program logs the value of `name`. The CLI prints the resulting `ExecutionContext` as JSON on stdout when the program finishes.

## Passing variables in

You can inject values from the command line with `--var`:

```bash
oto run hello.oto --var name=Emma
```

`--var` writes to `context.data` *before* execution. If your program does `@utils/set output=name` later, that overwrites it.

## A slightly more useful example

```oto
@utils/set input="Mars" output=planet
@utils/log message="Hello from {planet}"
```

Two things to notice:

1. `"Mars"` is a quoted string — it stays a literal string.
2. `"Hello from {planet}"` uses **braces** to interpolate. Inside `{}`, `planet` is treated as a variable reference; outside, it would be just the bare string `"planet"`.

This braces-vs-no-braces rule is the single most important syntactic decision in OTO. The next guide explains it in depth.

## Checking syntax without running

```bash
oto check hello.oto
```

`check` parses the program and reports any syntax errors, but does not execute. Useful for CI.

## Where to next

Read these guides in order:

1. [commands.md](./commands.md) — anatomy of a command, reserved args, output capture
2. [variables-and-expressions.md](./variables-and-expressions.md) — bare strings vs braced expressions, scope, member access
3. [pipes.md](./pipes.md) — transforming data with `|filter`, `|map`, etc.
4. [iteration.md](./iteration.md) — `forEach=`, `collect=`, `retry=`
5. [system-variables.md](./system-variables.md) — `$index`, `$count`, `$first`, `$last` inside loops
6. [human-validation.md](./human-validation.md) — pause for a human to approve mid-workflow
7. [security.md](./security.md) — secrets, env vars, what not to put in `.oto` files

## References

- **DSL specification:** [`../dsl-specification/dsl-0.5.md`](../dsl-specification/dsl-0.5.md) — the authoritative grammar for the language version this guide targets
- **CLI source:** `massivoto-platform/packages/runtime/src/bin/oto.ts` — the `oto` command-line entry point
- **Runner architecture:** [`../../packages/runtime/runtime.archi.md`](../../packages/runtime/runtime.archi.md) — how `runProgram` parses and executes a `.oto` file
- **Identifier roles:** [`../dsl-specification/identifier-roles.md`](../dsl-specification/identifier-roles.md) — formal semantics of bare identifiers vs braced expressions
