# PRD: LocalAppletLauncher

**Status:** DRAFT
**Last updated:** 2026-01-21
**Target Version:** 0.5
**Location:** `packages/runtime/src/applets/local/`

## Progress

| Section | Status | Progress |
|---------|--------|----------|
| Interfaces | ❌ Not Started | 0/3 |
| Implementation | ❌ Not Started | 0/4 |
| Infrastructure | ❌ Not Started | 0/5 |
| Testing | ❌ Not Started | 0/3 |
| Acceptance Criteria | ❌ Not Started | 0/8 |
| **Overall** | **DRAFT** | **0%** |

## Requirements

### Interfaces

**Last updated:** 2026-01-21
**Test:** `npx vitest run src/applets/types.spec.ts`
**Progress:** 0/3 (0%)

- ❌ R-APPLET-01: Define AppletLauncher interface with `launch(appletId, input, ctx)` method
- ❌ R-APPLET-02: Define AppletInstance interface with `id`, `url`, `appletId`, `terminator`, `waitForResponse()`
- ❌ R-APPLET-03: Define AppletTerminator interface with `terminate()` and `isTerminated`

### Implementation

**Last updated:** 2026-01-21
**Test:** `npx vitest run src/applets/local/`
**Progress:** 0/4 (0%)

- ❌ R-APPLET-21: Implement LocalAppletLauncher that resolves applet package and creates instance
- ❌ R-APPLET-22: Implement LocalAppletInstance that starts Express server and serves React frontend
- ❌ R-APPLET-23: Implement LocalAppletTerminator that stops server and releases port
- ❌ R-APPLET-24: Implement waitForResponse that blocks until POST /respond or timeout

### Infrastructure

**Last updated:** 2026-01-21
**Test:** `npx vitest run src/applets/local/`
**Progress:** 0/5 (0%)

- ❌ R-APPLET-41: Implement PortAllocator that finds available ports in 10000-20000 range
- ❌ R-APPLET-42: Implement per-applet timeout from AppletDefinition.timeoutMs, fallback to launcher default (48h production, 8s tests)
- ❌ R-APPLET-43: Implement error types (AppletNotFoundError, AppletTimeoutError, AppletTerminatedError, AppletValidationError)
- ❌ R-APPLET-44: Implement AppletServerFactory interface for testability
- ❌ R-APPLET-45: Implement MinimalTestServerFactory (raw http.createServer, POST /respond only)

### Testing

**Last updated:** 2026-01-21
**Test:** `npx vitest run src/applets/local/`
**Progress:** 0/3 (0%)

- ❌ R-APPLET-61: Unit tests use MinimalTestServerFactory, no dependency on applet packages
- ❌ R-APPLET-62: Integration tests verify POST /respond resolves waitForResponse
- ❌ R-APPLET-63: Tests use 8 second timeout (real clock), verify timeout error is thrown

## Overview

LocalAppletLauncher is the v0.5 implementation of the AppletLauncher interface. It spawns applets on localhost with random ports between 10000-20000. Each applet instance runs an Express backend serving a React frontend, collects user input, and returns it to the interpreter.

## Context

From ROADMAP:
> Between commands, deploy a mini web app for human input, called Applets.
> For v0.5: Applets run on localhost with dynamic ports.

The LocalAppletLauncher enables local development and testing of automation workflows that require human validation checkpoints.

## Interfaces

### AppletLauncher (abstract)

```typescript
interface AppletLauncher {
  /**
   * Launch an applet instance.
   * @param appletId - Registry key ("confirm", "grid", "generation")
   * @param input - Data to display/validate (validated against inputSchema)
   * @param ctx - ExecutionContext for store/auth access
   * @returns Instance of the running applet
   */
  launch(appletId: string, input: unknown, ctx: ExecutionContext): Promise<AppletInstance>
}
```

### AppletInstance

```typescript
interface AppletInstance {
  /** Unique instance identifier (cuid) */
  readonly id: string

  /** URL where the applet is accessible */
  readonly url: string

  /** Applet definition ID */
  readonly appletId: string

  /** Terminator for this instance */
  readonly terminator: AppletTerminator

  /**
   * Wait for user to submit response.
   * Blocks until POST /respond is received or timeout.
   * @returns User response (validated against outputSchema)
   * @throws AppletTimeoutError after timeout
   * @throws AppletTerminatedError if terminated before response
   */
  waitForResponse<T>(): Promise<T>
}
```

### AppletTerminator

```typescript
interface AppletTerminator {
  /**
   * Terminate the applet instance.
   * Stops the server, releases the port, rejects pending waitForResponse.
   */
  terminate(): Promise<void>

  /** Whether the instance has been terminated */
  readonly isTerminated: boolean
}
```

The AppletInstance creates and exposes its own AppletTerminator. This allows:
- Interpreter to terminate on timeout or cancel
- Clean separation of concerns
- Easy mocking in tests

## Implementation

### LocalAppletLauncher

```typescript
interface LocalAppletLauncherConfig {
  registry: AppletRegistry
  portAllocator?: PortAllocator          // Default: 10000-20000
  serverFactoryResolver?: ServerFactoryResolver  // Default: AppletPackageServerFactory
  defaultTimeoutMs?: number              // Fallback if applet doesn't define timeout. Default: 48h, tests use 8000ms
}

interface AppletDefinition {
  inputSchema: ZodSchema
  outputSchema: ZodSchema
  packageName?: string                   // npm package, defaults to @massivoto/applet-{id}
  timeoutMs?: number                     // Per-applet timeout, falls back to launcher default
}

type ServerFactoryResolver = (appletId: string, definition: AppletDefinition) => AppletServerFactory

class LocalAppletLauncher implements AppletLauncher {
  private registry: AppletRegistry
  private portAllocator: PortAllocator
  private serverFactoryResolver: ServerFactoryResolver
  private defaultTimeoutMs: number

  constructor(config: LocalAppletLauncherConfig) {
    this.registry = config.registry
    this.portAllocator = config.portAllocator ?? new PortAllocator(10000, 20000)
    this.defaultTimeoutMs = config.defaultTimeoutMs ?? 48 * 60 * 60 * 1000
    this.serverFactoryResolver = config.serverFactoryResolver ?? ((appletId, def) => {
      const packageName = def.packageName ?? `@massivoto/applet-${appletId}`
      return new AppletPackageServerFactory(packageName)
    })
  }

  async launch(appletId: string, input: unknown, ctx: ExecutionContext): Promise<AppletInstance> {
    // 1. Get definition from registry
    const entry = await this.registry.get(appletId)
    if (!entry) throw new AppletNotFoundError(appletId)

    // 2. Validate input against schema
    const definition = entry.value
    const validatedInput = definition.inputSchema.parse(input)

    // 3. Resolve server factory (test vs production)
    const serverFactory = this.serverFactoryResolver(appletId, definition)

    // 4. Allocate port
    const port = await this.portAllocator.allocate()

    // 5. Determine timeout (per-applet or fallback to default)
    const timeoutMs = definition.timeoutMs ?? this.defaultTimeoutMs

    // 6. Create instance (which creates its own terminator)
    const instance = new LocalAppletInstance({
      id: createId(),
      appletId,
      port,
      input: validatedInput,
      ctx,
      outputSchema: definition.outputSchema,
      portAllocator: this.portAllocator,
      timeoutMs,
    })

    // 7. Start server with factory
    await instance.start(serverFactory)

    return instance
  }
}
```

### AppletServerFactory (Abstraction for Testability)

```typescript
/**
 * Factory that creates the HTTP server for an applet.
 * This abstraction allows testing LocalAppletLauncher without real applet packages.
 */
interface AppletServerFactory {
  createServer(config: AppletServerConfig): http.Server
}

interface AppletServerConfig {
  port: number
  input: unknown
  onResponse: (data: unknown) => void
}

/**
 * Production factory: loads applet package and creates Express server
 */
class AppletPackageServerFactory implements AppletServerFactory {
  constructor(private packageName: string) {}

  createServer(config: AppletServerConfig): http.Server {
    const appletPkg = require(this.packageName)
    const app = appletPkg.createServer({
      input: config.input,
      onResponse: config.onResponse,
    })
    app.use(express.static(appletPkg.frontendDir))
    return app.listen(config.port)
  }
}

/**
 * Test factory: minimal raw Node.js http server
 * No dependencies on applet packages - just accepts POST /respond
 */
class MinimalTestServerFactory implements AppletServerFactory {
  createServer(config: AppletServerConfig): http.Server {
    const server = http.createServer((req, res) => {
      if (req.method === 'POST' && req.url === '/respond') {
        let body = ''
        req.on('data', chunk => body += chunk)
        req.on('end', () => {
          const data = JSON.parse(body)
          config.onResponse(data)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: true }))
        })
      } else {
        res.writeHead(200, { 'Content-Type': 'text/plain' })
        res.end('Applet running')
      }
    })
    server.listen(config.port)
    return server
  }
}
```

### LocalAppletInstance

```typescript
class LocalAppletInstance implements AppletInstance {
  readonly id: string
  readonly url: string
  readonly appletId: string
  readonly terminator: LocalAppletTerminator

  private server: Server | null = null
  private responsePromise: DeferredPromise<unknown>
  private timeoutMs: number

  constructor(config: LocalAppletInstanceConfig) {
    this.id = config.id
    this.appletId = config.appletId
    this.url = `http://localhost:${config.port}`
    this.timeoutMs = config.timeoutMs ?? 48 * 60 * 60 * 1000 // 48h default, 8s for tests
    // Instance creates its own terminator
    this.terminator = new LocalAppletTerminator(this, config.portAllocator)
  }

  async start(serverFactory: AppletServerFactory): Promise<void> {
    this.server = serverFactory.createServer({
      port: this.port,
      input: this.input,
      onResponse: (data: unknown) => {
        const validated = this.outputSchema.parse(data)
        this.responsePromise.resolve(validated)
      },
    })
  }

  /** Called by LocalAppletTerminator */
  _stopServer(): void {
    if (this.server) {
      this.server.close()
      this.server = null
    }
  }

  /** Called by LocalAppletTerminator */
  _rejectResponse(error: Error): void {
    this.responsePromise.reject(error)
  }

  async waitForResponse<T>(): Promise<T> {
    const timeout = setTimeout(() => {
      this.responsePromise.reject(new AppletTimeoutError(this.id, this.timeoutMs))
    }, this.timeoutMs)

    try {
      return await this.responsePromise.promise as T
    } finally {
      clearTimeout(timeout)
    }
  }
}
```

### LocalAppletTerminator

```typescript
class LocalAppletTerminator implements AppletTerminator {
  private instance: LocalAppletInstance
  private portAllocator: PortAllocator
  private _isTerminated: boolean = false

  constructor(instance: LocalAppletInstance, portAllocator: PortAllocator) {
    this.instance = instance
    this.portAllocator = portAllocator
  }

  get isTerminated(): boolean {
    return this._isTerminated
  }

  async terminate(): Promise<void> {
    if (this._isTerminated) return

    // 1. Stop the server
    this.instance._stopServer()

    // 2. Release the port
    this.portAllocator.release(this.instance.port)

    // 3. Reject pending response
    this.instance._rejectResponse(new AppletTerminatedError(this.instance.id))

    this._isTerminated = true
  }
}
```

## Error Types

```typescript
class AppletNotFoundError extends Error {
  constructor(appletId: string) {
    super(`Applet not found: ${appletId}`)
  }
}

class AppletTimeoutError extends Error {
  constructor(handleId: string, timeoutMs: number) {
    super(`Applet ${handleId} timed out after ${timeoutMs}ms`)
  }
}

class AppletTerminatedError extends Error {
  constructor(handleId: string) {
    super(`Applet ${handleId} was terminated before response`)
  }
}

class AppletValidationError extends Error {
  constructor(handleId: string, zodError: ZodError) {
    super(`Applet ${handleId} response validation failed: ${zodError.message}`)
  }
}
```

## Port Allocation

```typescript
async function findAvailablePort(min: number, max: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.listen(0, '127.0.0.1', () => {
      const port = (server.address() as net.AddressInfo).port
      server.close(() => {
        if (port >= min && port <= max) {
          resolve(port)
        } else {
          // Port outside range, try again with explicit port
          tryExplicitPort(min, max).then(resolve).catch(reject)
        }
      })
    })
  })
}
```

## Testing Strategy

### Test Configuration

```typescript
// All tests use MinimalTestServerFactory - no applet packages required
const testLauncher = new LocalAppletLauncher({
  registry: mockRegistry,
  serverFactoryResolver: () => new MinimalTestServerFactory(),
  defaultTimeoutMs: 8000,  // 8 seconds for tests
})
```

### Unit Tests (vitest)
- Port allocation finds available port in range
- Port is released after termination
- Input schema validation rejects invalid data
- Output schema validation rejects malformed response
- Timeout behavior with 8s timeout (real clock, not mocks)
- Error cases (applet not found, validation failure)
- Terminator stops server and rejects pending promise

### Integration Tests (vitest + fetch)
- POST /respond resolves waitForResponse with correct data
- Server responds to GET / (health check)
- Multiple concurrent applets on different ports
- Terminating one applet doesn't affect others

### Test Example

```typescript
describe('LocalAppletLauncher', () => {
  it('resolves waitForResponse when POST /respond is received', async () => {
    const launcher = new LocalAppletLauncher({
      registry: createMockRegistry(),
      serverFactoryResolver: () => new MinimalTestServerFactory(),
      defaultTimeoutMs: 8000,
    })

    const instance = await launcher.launch('confirm', { message: 'Approve?' }, mockCtx)

    // Simulate user approval via HTTP POST (no browser needed)
    const responsePromise = instance.waitForResponse()
    await fetch(`${instance.url}/respond`, {
      method: 'POST',
      body: JSON.stringify({ approved: true }),
    })

    const result = await responsePromise
    expect(result).toEqual({ approved: true })

    await instance.terminator.terminate()
  })
})
```

### No E2E/Playwright Tests for Infrastructure

E2E tests with Playwright are for the **applet packages** (confirm, grid, generation), not for LocalAppletLauncher. The launcher infrastructure is fully testable with HTTP POST.

## File Structure

```
packages/runtime/src/applets/
│
│  ┌─────────────────────────────────────────────────────────────────┐
│  │  SHARED INTERFACES (both local and cloud implement these)       │
│  └─────────────────────────────────────────────────────────────────┘
│
├── types.ts                         # AppletLauncher, AppletInstance, AppletTerminator
├── errors.ts                        # AppletNotFoundError, AppletTimeoutError, etc.
├── index.ts                         # Re-exports interfaces + createAppletLauncher()
│
│  ┌─────────────────────────────────────────────────────────────────┐
│  │  LOCAL IMPLEMENTATION (v0.5)                                     │
│  └─────────────────────────────────────────────────────────────────┘
│
└── local/
    ├── local-applet-launcher.prd.md # This file
    ├── local-applet-launcher.ts     # implements AppletLauncher
    ├── local-applet-launcher.spec.ts
    ├── local-applet-instance.ts     # implements AppletInstance
    ├── local-applet-instance.spec.ts
    ├── local-applet-terminator.ts   # implements AppletTerminator
    ├── local-applet-terminator.spec.ts
    ├── port-allocator.ts            # Local-specific: finds ports 10000-20000
    ├── port-allocator.spec.ts
    ├── server-factories/            # Local-specific: http server creation
    │   ├── server-factory.ts            # Interface (local only)
    │   ├── applet-package-factory.ts    # Production: loads npm packages
    │   ├── minimal-test-factory.ts      # Test: raw http.createServer
    │   └── minimal-test-factory.spec.ts
    └── index.ts
```

Future v1.0:
```
packages/runtime/src/applets/
│
│  (shared types.ts and errors.ts unchanged)
│
└── cloud/                           # v1.0 AWS implementation
    ├── cloud-applet-launcher.ts     # implements AppletLauncher
    ├── cloud-applet-instance.ts     # implements AppletInstance
    ├── cloud-applet-terminator.ts   # implements AppletTerminator
    ├── ecs-task-manager.ts          # Cloud-specific: ECS task lifecycle
    ├── proxy-router.ts              # Cloud-specific: routes by session ID
    └── cost-tracker.ts              # Cloud-specific: hourly billing
```

## Dependencies

- `express` - Backend server
- `zod` - Schema validation
- `@massivoto/kit` - createId (cuid), AppletRegistry
- `net` - Port allocation

## Open Questions

1. ~~**Timeout configuration:** Should timeout be per-applet or global?~~ **Resolved:** Per-applet. Each applet definition can specify its own timeout.
2. ~~**Concurrent limits:** Should we limit number of active applets?~~ **Resolved:** No limit for v0.5. Monitoring and limits deferred to v1.0.
3. ~~**Cleanup on crash:** If the process crashes, ports may stay bound.~~ **Resolved:** Critical issue deferred to v1.0. Cannot wait for timeout to stop invoicing on crash. See ROADMAP v1.0 Production Hardening.

## Future (v1.0)

CloudAppletLauncher will implement the same interface but:
- Launch Docker containers on AWS ECS
- Use proxy routing instead of direct ports
- Track costs per running container
- Auto-terminate on timeout or budget exhaustion

## Acceptance Criteria

### Theme

> **Theme:** Social Media Automation
>
> Reused from: [dsl-0.5-parser.prd.md](../../compiler/parser/dsl-0.5-parser.prd.md)
>
> Test scenarios use content approval workflows where human reviewers validate
> AI-generated social media posts before publishing.

### Criteria

- [ ] AC-APPLET-01: Given Emma launches an applet instance,
      when the server starts, then it is reachable at http://localhost:<port> and responds to HTTP requests
- [ ] AC-APPLET-02: Given Carlos launches a confirm applet and waits for response,
      when a POST request is sent to `/respond` with `{ approved: true }`,
      then `waitForResponse()` resolves with `{ approved: true }`
- [ ] AC-APPLET-03: Given Carlos launches a grid applet with 10 items and waits for response,
      when a POST request is sent to `/respond` with `{ selected: ["item1", "item3", "item7"] }`,
      then `waitForResponse()` resolves with the 3 selected items
- [ ] AC-APPLET-04: Given an applet is configured with 8 second timeout (test mode),
      when no response is received within 8 seconds, then `waitForResponse()` rejects with `AppletTimeoutError`
- [ ] AC-APPLET-05: Given an applet is running on a dynamically allocated port,
      when `terminator.terminate()` is called,
      then the server stops, the port is released, and `waitForResponse()` rejects with `AppletTerminatedError`
- [ ] AC-APPLET-06: Given Emma launches two applets concurrently,
      when both start successfully, then each runs on a different port and both can receive independent POST responses
- [ ] All tests use the minimal test server (raw Node.js http), not the real applet packages
- [ ] Edge cases covered in `*.edge.spec.ts` files (invalid input, port exhaustion, schema validation failure)
