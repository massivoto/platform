# Architecture: Applets (Human Validation Checkpoints)

**Last updated:** 2026-01-27

## Parent

- [Kit Package](../../../kit.archi.md)

## Children

- [confirm applet](../../../../applets/confirm/) - Reference implementation

## Overview

Applets are temporary web applications deployed mid-workflow to collect human input. When an OTO program hits `@human/validation`, the runtime spawns an applet (Express backend + React frontend) on a dynamic port, waits for user response, then terminates. The AppletRegistry (in kit) maps applet names to definitions, while the AppletLauncher (in runtime) handles lifecycle. Standard applets (confirm, grid, generation) are separate packages in the `/applets/` monorepo workspace.

## Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          APPLET SYSTEM                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  @massivoto/kit                          @massivoto/runtime                 │
│  ┌─────────────────────┐                 ┌─────────────────────┐            │
│  │   AppletRegistry    │                 │   AppletLauncher     │            │
│  │   extends           │────────────────►│   (lifecycle mgmt)  │            │
│  │   ComposableRegistry│  get(name)      │                     │            │
│  └─────────────────────┘                 └──────────┬──────────┘            │
│            │                                        │                       │
│            │ stores                                 │ spawn()               │
│            ▼                                        ▼                       │
│  ┌─────────────────────┐                 ┌─────────────────────────────┐   │
│  │  AppletDefinition   │                 │     APPLET INSTANCE         │   │
│  │  extends RegistryItem│                 │  ┌───────────┐ ┌─────────┐  │   │
│  │                     │                 │  │  Express  │ │  React  │  │   │
│  │  id: "confirm"      │                 │  │  Backend  │◄┤  Front  │  │   │
│  │  inputSchema: Zod   │                 │  │ :10000-20K│ │  (Vite) │  │   │
│  │  outputSchema: Zod  │                 │  └───────────┘ └─────────┘  │   │
│  │  packageName?: str  │                 └─────────────────────────────┘   │
│  └─────────────────────┘                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                       /applets/ WORKSPACE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  applets/                                                                   │
│  ├── confirm/              @massivoto/applet-confirm                        │
│  │   ├── package.json                                                       │
│  │   ├── front/            React: approve/reject buttons                    │
│  │   └── back/             Express: POST /respond                           │
│  │                                                                          │
│  ├── grid/                 @massivoto/applet-grid                           │
│  │   ├── package.json                                                       │
│  │   ├── front/            React: checkbox list                             │
│  │   └── back/             Express: POST /respond                           │
│  │                                                                          │
│  └── generation/           @massivoto/applet-generation                     │
│      ├── package.json                                                       │
│      ├── front/            React: editable text per item                    │
│      └── back/             Express: POST /respond                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Components

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `AppletDefinition` | kit/applets/types.ts | Interface extending RegistryItem with schemas and optional packageName |
| `AppletRegistry` | kit/applets/ | ComposableRegistry<AppletDefinition> for name→definition lookup |
| `AppletLauncher` | runtime/applets/types.ts | **Interface** for launching applets |
| `AppletInstance` | runtime/applets/types.ts | **Interface** for running applet (id, url, waitForResponse) |
| `AppletTerminator` | runtime/applets/types.ts | **Interface** for terminating applets (created by instance) |
| `LocalAppletLauncher` | runtime/applets/local/ | **Implements** AppletLauncher for localhost:10000-20000 |
| `LocalAppletInstance` | runtime/applets/local/ | **Implements** AppletInstance with http server |
| `LocalAppletTerminator` | runtime/applets/local/ | **Implements** AppletTerminator, stops server, releases port |
| `CloudAppletLauncher` | runtime/applets/cloud/ | **Implements** AppletLauncher for AWS ECS (v1.0) |

## Interface/Implementation Separation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  packages/runtime/src/applets/                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                    SHARED INTERFACES (types.ts)                        │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │                                                                        │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │ │
│  │  │ AppletLauncher  │  │ AppletInstance  │  │AppletTerminator │       │ │
│  │  │  (interface)    │  │  (interface)    │  │  (interface)    │       │ │
│  │  │                 │  │                 │  │                 │       │ │
│  │  │ launch()        │  │ id, url         │  │ terminate()     │       │ │
│  │  │                 │  │ waitForResponse │  │ isTerminated    │       │ │
│  │  │                 │  │ terminator      │  │                 │       │ │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘       │ │
│  │           │                    │                    │                 │ │
│  └───────────┼────────────────────┼────────────────────┼─────────────────┘ │
│              │                    │                    │                   │
│              │ implements         │ implements         │ implements        │
│              │                    │                    │                   │
│  ┌───────────┼────────────────────┼────────────────────┼─────────────────┐ │
│  │           ▼                    ▼                    ▼      local/     │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │ │
│  │  │LocalApplet      │  │LocalApplet      │  │LocalApplet      │       │ │
│  │  │Launcher         │  │Instance         │  │Terminator       │       │ │
│  │  │                 │  │                 │  │                 │       │ │
│  │  │ + PortAllocator │  │ + http.Server   │  │ + port release  │       │ │
│  │  │ + ServerFactory │  │                 │  │                 │       │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘       │ │
│  │                                                         (v0.5)       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │           ▼                    ▼                    ▼      cloud/     │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │ │
│  │  │CloudApplet      │  │CloudApplet      │  │CloudApplet      │       │ │
│  │  │Launcher         │  │Instance         │  │Terminator       │       │ │
│  │  │                 │  │                 │  │                 │       │ │
│  │  │ + EcsTaskMgr    │  │ + proxy URL     │  │ + ECS stop task │       │ │
│  │  │ + ProxyRouter   │  │ + cost tracking │  │                 │       │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘       │ │
│  │                                                         (v1.0)       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Dependency injection:** The Interpreter receives an `AppletLauncher` interface. At startup:
- Local dev: inject `LocalAppletLauncher`
- Production: inject `CloudAppletLauncher`
- Tests: inject mock or `LocalAppletLauncher` with `MinimalTestServerFactory`

### Standard Applets

| Applet | Location | Status |
|--------|----------|--------|
| `applet-confirm` | applets/confirm/ | Implemented - text + approve/reject |
| `applet-grid` | applets/grid/ | Not yet - array selection with checkboxes |
| `applet-generation` | applets/generation/ | Not yet - generated/editable text per item |

## Interfaces

### AppletDefinition (Hybrid Convention)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      AppletDefinition                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  readonly id: string           // "confirm", "grid", "acme-approval"    │
│  readonly type: "applet"                                                │
│  inputSchema: ZodType          // validates command args                │
│  outputSchema: ZodType         // validates user response               │
│  packageName?: string          // default: @massivoto/applet-${id}      │
│  init(): Promise<void>                                                  │
│  dispose(): Promise<void>                                               │
└─────────────────────────────────────────────────────────────────────────┘
```

Convention: If `packageName` is omitted, launcher resolves `@massivoto/applet-${id}`.
Override: Custom applets set `packageName: "@acme/approval-flow"`.

### AppletLauncher (Interface)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      AppletLauncher                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  launch(appletId, input, ctx) → AppletInstance                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      AppletInstance                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  id: string                  // unique instance id                       │
│  url: string                 // http://localhost:12345                   │
│  appletId: string            // "confirm", "grid"                        │
│  terminator: AppletTerminator // created by instance                     │
│  waitForResponse() → T       // blocks until user submits                │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      AppletTerminator                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  terminate() → void          // stops server, releases port              │
│  isTerminated: boolean       // whether already terminated               │
└─────────────────────────────────────────────────────────────────────────┘

Implementations:
┌─────────────────────────┐     ┌─────────────────────────┐
│  LocalAppletLauncher    │     │  CloudAppletLauncher    │
│  LocalAppletInstance    │     │  CloudAppletInstance    │
│  LocalAppletTerminator  │     │  CloudAppletTerminator  │
│  (v0.5)                 │     │  (v1.0)                 │
│  localhost:10000-20000  │     │  Docker on AWS ECS      │
└─────────────────────────┘     └─────────────────────────┘
```

### Applet Package Contract

Each applet package exports:

```
┌─────────────────────────────────────────────────────────────────────────┐
│              @massivoto/applet-{name} exports                            │
├─────────────────────────────────────────────────────────────────────────┤
│  definition: AppletDefinition     // for registry                       │
│  createServer(opts) → Express     // backend factory                    │
│  frontendDir: string              // path to built React assets         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Reference Implementation: confirm applet

The `applets/confirm/` package serves as the reference implementation pattern for all applets.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    @massivoto/applet-confirm                                 │
│                    (applets/confirm/)                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  src/                                                                       │
│  ├── index.ts          ← Package entry point (exports below)                │
│  ├── definition.ts     ← AppletDefinition + Zod schemas                     │
│  ├── server.ts         ← createServer() factory + frontendDir               │
│  ├── resource-type.ts  ← Utility: detect image/video/pdf/embed              │
│  └── docker-entry.ts   ← Standalone entry for Docker container              │
│                                                                             │
│  front/                                                                     │
│  └── src/                                                                   │
│      ├── App.tsx       ← React UI: title, message, approve/reject           │
│      └── ResourceDisplay.tsx ← Media display component                      │
│                                                                             │
│  dist/                                                                      │
│  ├── *.js, *.d.ts      ← Compiled backend                                   │
│  └── front/            ← Built React assets (served by Express)             │
│                                                                             │
│  Dockerfile            ← Container image definition                         │
│  docker-compose.yml    ← Local development with env vars                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

Exports from index.ts:
┌─────────────────────────────────────────────────────────────────────────────┐
│  definition: AppletDefinition     // Complete definition with schemas       │
│  confirmInputSchema: ZodSchema    // For external validation                │
│  confirmOutputSchema: ZodSchema   // For external validation                │
│  createServer(config): Express    // Server factory for launcher            │
│  frontendDir: string              // Path to built React assets             │
│  getResourceType(url): ResourceType  // URL to media type                   │
│  toEmbedUrl(url): string          // Convert YouTube/Vimeo to embed         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Kit vs Applet Responsibility

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RESPONSIBILITY SPLIT                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  @massivoto/kit                        @massivoto/applet-confirm            │
│  ┌─────────────────────────┐           ┌─────────────────────────┐         │
│  │  AppletDefinition       │           │  definition             │         │
│  │  (interface)            │◄──────────│  (implements interface) │         │
│  └─────────────────────────┘           │  + actual schemas       │         │
│                                        │  + packageName          │         │
│  ┌─────────────────────────┐           │  + timeoutMs            │         │
│  │  AppletRegistry         │           └─────────────────────────┘         │
│  │  (stores definitions)   │                                               │
│  └─────────────────────────┘           ┌─────────────────────────┐         │
│                                        │  createServer()         │         │
│  ┌─────────────────────────┐           │  (Express factory)      │         │
│  │  CoreAppletsBundle      │           │  - /health endpoint     │         │
│  │  (skeleton defs)        │─ ─ ─ ─ ─ ─│  - /api/input GET       │         │
│  │  ⚠ Duplicates schemas  │   import? │  - /respond POST        │         │
│  └─────────────────────────┘           │  - static frontend      │         │
│                                        └─────────────────────────┘         │
│  ┌─────────────────────────┐                                               │
│  │  Docker utilities       │           ┌─────────────────────────┐         │
│  │  generateDockerfile()   │──────────►│  Dockerfile             │         │
│  │  generateCompose()      │   used by │  docker-compose.yml     │         │
│  │  createHealthMiddleware │           │  docker-entry.ts        │         │
│  └─────────────────────────┘           └─────────────────────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Known Issue: Schema Duplication

The `CoreAppletsBundle` in kit duplicates the Zod schemas that also exist in each applet package. This is intentional for now:

- **Kit CoreAppletsBundle**: Provides skeleton definitions so the registry can validate input/output even without importing the full applet package
- **Applet packages**: Export the authoritative schemas for use by the launcher and tests

Future improvement: CoreAppletsBundle could dynamically import schemas from applet packages rather than duplicating them.

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    APPLET EXECUTION FLOW                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  OTO Program                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  @human/validation items=data display=grid output=selected      │   │
│  └──────────────────────────────┬──────────────────────────────────┘   │
│                                 │                                       │
│                                 ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  1. Interpreter calls launcher.launch("grid", data, ctx)        │   │
│  └──────────────────────────────┬──────────────────────────────────┘   │
│                                 │                                       │
│                                 ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  2. Launcher resolves package: @massivoto/applet-grid           │   │
│  │     - Picks random port 10000-20000                              │   │
│  │     - Creates AppletInstance + AppletTerminator                  │   │
│  │     - Starts Express backend with ExecutionContext               │   │
│  │     - Serves React frontend                                      │   │
│  └──────────────────────────────┬──────────────────────────────────┘   │
│                                 │                                       │
│                                 ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  3. Returns AppletInstance { url: "http://localhost:15432" }    │   │
│  │     - Interpreter logs URL for user                              │   │
│  │     - Calls instance.waitForResponse()                           │   │
│  └──────────────────────────────┬──────────────────────────────────┘   │
│                                 │                                       │
│                                 ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  4. User opens URL, interacts with React UI                     │   │
│  │     - Selects items in grid                                      │   │
│  │     - Clicks Submit                                              │   │
│  │     - Frontend POSTs to /respond                                 │   │
│  └──────────────────────────────┬──────────────────────────────────┘   │
│                                 │                                       │
│                                 ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  5. Backend validates against outputSchema                      │   │
│  │     - waitForResponse() resolves with user data                  │   │
│  │     - Interpreter calls instance.terminator.terminate()          │   │
│  │     - Express server terminates, port released                   │   │
│  └──────────────────────────────┬──────────────────────────────────┘   │
│                                 │                                       │
│                                 ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  6. Interpreter stores result: context.set("selected", data)    │   │
│  │     - Execution continues to next command                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Non-UI Input (CLI/API)

Applets also accept input without UI for testing and automation:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    NON-UI INPUT CHANNELS                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  REST API:                                                              │
│    POST http://localhost:15432/respond                                  │
│    Body: { "selected": ["item1", "item3"] }                             │
│                                                                         │
│  CLI (Commander):                                                       │
│    massivoto respond --applet 15432 --data '{"selected": [...]}'        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Timeout & Cost (v0.5 vs v1.0)

| Aspect | v0.5 (Local) | v1.0 (SaaS) |
|--------|--------------|-------------|
| Timeout | 48 hours default | Configurable per plan |
| Cost tracking | None | Hourly billing added to ExecutionContext |
| Port | Random 10000-20000 | Proxy routing per session |

## Dependencies

- **Depends on:**
  - `@massivoto/kit/registry` (ComposableRegistry, RegistryItem)
  - `zod` (schema validation)
  - `express` (backend)
  - `vite` + `react` (frontend)

- **Used by:**
  - `@massivoto/runtime` Interpreter (spawns applets on @human/* commands)
