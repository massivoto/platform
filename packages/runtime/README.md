````md
# @massivoto/runtime

**Massivoto Runtime** is the execution core for the Massivoto Automation Programming Language (APL): it evaluates a
Task (a list of DSL instructions) against an `ExecutionContext`, using a `CommandRegistry` and a pluggable
`CommandRunner`.

If you’re building **custom commands**, **custom runners** (local/container/lambda), or embedding Massivoto in another
product, this is the package you want.

---

## What you get

- **Interpreter**: executes a compiled Task (AST) instruction-by-instruction
- **ExecutionContext**: shared state (data, store, meta, cost caps, user info)
- **Expression evaluation**: resolve `{pipes}` and tokens against context
- **Registry / handlers**: route `@package/command` to an implementation
- **Runner interface**: swap execution strategies (in-process vs remote)

---

## Install

```bash
npm i @massivoto/runtime
# or
yarn add @massivoto/runtime
# or
pnpm add @massivoto/runtime
````

---

## Concepts

### Task (workflow)

A **Task** is a list of **instructions**.

```oto
@store/load name="camping_clusters" output=clusters
@loop/clusters input=clusters forEach=cluster
@generate/content keyword={cluster:main} output=pageContent
```

### Instruction

An instruction is:

* `command`: e.g. `@print/users`
* `arguments`: key/value expressions (strings or `{...}` expressions)
* optional control keywords: `if`, `forEach`, `while`, etc. (depending on your parser)

### ExecutionContext

The context is the single source of truth during execution: inputs, outputs, history, cost tracking.

```ts
export interface ExecutionContext {
    env: Record<string, string> // read-only; never persisted by the runtime
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
        current: number
        estimated: number
        maximum: number
        credits: number
    }
}
```

---

## Quickstart (TypeScript)

> The runtime expects an AST. You can generate it with your own parser or an upstream Massivoto parser package.

```ts
import {Interpreter} from "@massivoto/runtime";
import {CommandRegistry} from "@massivoto/runtime/registry";

// 1) Create a registry and register handlers
const registry = new CommandRegistry();

registry.register("@print/users", async ({args, ctx}) => {
    // args are resolved expressions (depending on your evaluator config)
    console.log("users:", args.users);
    return null;
});

// 2) Create the interpreter
const interpreter = new Interpreter(registry);

// 3) Provide an AST (InstructionNode / TaskNode depending on your implementation)
const taskAst = {
    type: "Task",
    instructions: [
        {
            type: "Instruction",
            command: "@print/users",
            arguments: {users: "{users:tail:10}"},
        },
    ],
};

// 4) Execute with an ExecutionContext
const ctx = {
    env: {},
    data: {users: [{id: 1}, {id: 2}]},
    extra: null,
    meta: {history: [], updatedAt: new Date().toISOString()},
    user: {id: "user_123", extra: {}},
    store: {kind: "memory"},
    prompts: [],
    cost: {current: 0, estimated: 0, maximum: 500, credits: 10_000},
};

await interpreter.execute(taskAst as any, ctx);
```

---

## Writing a CommandHandler

A handler is just a function that receives:

* resolved `args`
* the mutable `ctx`
* optional runtime hooks (logger, tracer, cost meter — depending on your setup)

Typical shape:

```ts
type CommandHandler = (input: {
    ctx: ExecutionContext;
    args: Record<string, any>;
}) => Promise<any>;
```

If your command returns a value and the instruction has `output=...`, the runtime writes it into `ctx.data` (or
`store.*` / `prompt.*` depending on your resolution rules).

---

## Runners

Runners let you decouple “interpreting instructions” from “where/how they run”.

Examples:

* **LocalRunner**: in-process execution (fast dev loop)
* **ContainerRunner**: sandboxed execution
* **LambdaRunner**: remote execution + metering

This package defines the interfaces; reference runners may live in `@massivoto/runners`.

---

## Design goals

* **No ambiguity**: the DSL is designed to be generated safely by AI
* **Developer-first**: readable, debuggable, diff-friendly
* **Composable**: commands are pure units; workflows are plain text

Non-goals:

* “No-code for everyone”
* heavy syntactic sugar

---

## License

Apache License 2.0 (Apache-2.0).

---

## Contributing

PRs are welcome, especially:

* interpreter hardening (errors, tracing, cost enforcement)
* expression evaluation edge-cases
* test vectors for DSL semantics

Keep changes small, add tests, and document any breaking behavior.

---

```

If you want, I can also generate:
- a **short** README variant (npm-friendly, < 120 lines),
- a **docs-first** README (architecture diagram + extension guide),
- and a companion `CONTRIBUTING.md` + `CODE_OF_CONDUCT.md`.
::contentReference[oaicite:0]{index=0}
```
