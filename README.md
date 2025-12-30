# Massivoto Platform (OSS)

Massivoto is an **Automation Programming Language** (APL) and platform to run
supervised automations written as text.

## Example Workflow for SEO Location Pages

This example `.oto` script performs keyword research to find the best camping

```oto
@seo/keywordResearch keyword="best camping location" output=clusters
@human/validate input=clusters  output=validatedClusters number=10
@generate/content keyword=cluster forEach=validatedClusters->cluster output=locations
@deploy/github contents=locations destination="https://www.gihub.com/myblog/content"
```

Think “n8n / Make”, but instead of clicking blocks, you write a small DSL
(`.oto`) designed to be:

- **AI-friendly** (predictable, low ambiguity)
- **diffable & shareable** (copy/paste workflows as text)
- **extensible** (commands + runners are modular)

This repository is the **Apache-2.0 open-source monorepo**: it contains
everything needed to **write, run, and extend** Massivoto locally.

---

## Monorepo contents

### `kit`

Shared utilities used across the platform (types, helpers, small primitives).

### `runtime`

The execution core:

- parser integration (AST in, results out)
- expression evaluation (paths + pipes, boolean guards)
- `ExecutionContext`
- `CommandRegistry`
- interpreter (instruction orchestration)
- **basic local runner** (reference implementation)

### `auth`

Authentication building blocks:

- user sign-in adapters (Auth.js integration layer)
- connection patterns for credentials (OAuth, API keys, Web3, …)
- token/credential abstractions (no provider lock-in)

> Note: the hosted SaaS adds additional features and integrations in private
> repos.

### `commands`

A minimal **stdlib** of commands/actions to make the language useful
out-of-the-box. Examples: printing, basic transforms, simple HTTP fetch,
notifications (depending on what’s implemented).

### `runners`

Reference runners to execute commands:

- local / in-process
- optional process/container runners (depending on maturity)

### `demo`

A SaaS-like demo app showcasing:

- the editor experience
- a task runner loop
- local execution with a runner

---

## Quickstart

> Requirements: Node.js (LTS), Yarn.

```bash
git clone https://github.com/massivoto/platform.git
cd platform
yarn
yarn build
```

### Run the demo

```bash
yarn demo dev
```

---

## Example `.oto`

```oto
@store/load name="camping_clusters" output=clusters
@loop/clusters input=clusters forEach=cluster
@generate/content keyword={cluster:main} output=pageContent
@print/text value={pageContent}
```

Massivoto programs are typically embedded in Markdown:

````md
Here is my automation:

```oto
@print/text value="Hello"
```
````

---

## Architecture (high level)

Massivoto executes a Task as:

1. Parse `.oto` into an AST (instructions + expressions)
2. For each instruction:
   - evaluate guards (`if/while`)
   - resolve arguments (expressions: paths + pipes)
   - dispatch to a command handler via `CommandRegistry`
   - apply `output=...` to `ExecutionContext`
   - record history + cost metering

Runners define _where/how_ commands execute (local vs sandbox vs remote).

---

## Repository layout

This is a Yarn workspaces monorepo with the usual split:

- **`packages/`**: reusable libraries (published or internal)
- **`apps/`**: runnable applications (demo apps, dev tools)

```txt
.
├─ packages/
│  ├─ kit/
│  ├─ runtime/
│  ├─ commands/
│  └─ runners/
└─ apps/
   ├─ auth/
   └─ demo/

```

## Design principles

- **No ambiguity**: syntax and evaluation are deterministic.
- **Safe by default**: no arbitrary code execution in expressions.
- **Composable**: commands are small, workflows are text.
- **Supervised automation**: human-in-the-loop is a first-class use case.

---

## License

Licensed under the **Apache License, Version 2.0** (`Apache-2.0`).

See `LICENSE`.

---

## Contributing

Contributions are welcome. Good first areas:

- command stdlib improvements
- expression evaluation edge cases + tests
- better errors and execution logs
- additional runners (sandboxed execution)

Please open an issue before big changes to align on the APL contract.

---

## Related

- **Massivoto Cloud** (private): vertical command packs (SEO/Social), managed
  runners, billing, and hosted UX.
- This repo remains the canonical OSS reference for the language + runtime.

```

```
