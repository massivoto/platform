# PRD: Confirm Applet

**Status:** APPROVED
**Last updated:** 2026-01-26
**Target Version:** 0.5
**Location:** `applets/confirm/`

## Progress

| Section | Status | Progress |
|---------|--------|----------|
| Package Setup | DONE | 3/3 |
| Backend | DONE | 4/4 |
| Frontend | DONE | 5/5 |
| Resource Display | DONE | 4/4 |
| Testing | DONE | 4/4 |
| Runtime Integration | NOT STARTED | 0/6 |
| ExecutionContext Changes | NOT STARTED | 0/4 |
| End-to-End Integration | NOT STARTED | 0/5 |
| Acceptance Criteria | PARTIAL | 7/12 |
| **Overall** | **APPROVED** | **70%** |

## Parent PRD

- [Applet Registry](../../packages/kit/src/applets/applet.prd.md)

## Child PRDs

- None

## Context

The Confirm applet is the first standard applet for Massivoto. It provides a simple approve/reject UI for human validation checkpoints in automation workflows. When an OTO program hits `@human/validation display=confirm`, the LocalAppletLauncher spawns this applet, displays a message (and optional resource), and waits for user response.

This is the simplest applet and serves as the template for grid and generation applets.

## Decision Log

| Date | Option | Decision | Rationale |
|------|--------|----------|-----------|
| 2026-01-22 | Resource display | **Auto-detect from URL** | `resourceUrl?: string` with auto-detection for images/video/PDF/embeds. No external library needed, 100% browser native. |
| 2026-01-26 | Output format | **Boolean** | Handler returns `true`/`false` to output variable. Simple, programmatic. |
| 2026-01-26 | Browser launch | **User opens manually** | Program logs URL, user opens browser. Works for AWS deployment where runner is remote. Testable with Playwright. |
| 2026-01-26 | AppletLauncher injection | **`context.appletLauncher`** | Explicit field on ExecutionContext. Type-safe, discoverable. Will refactor to DI in v1.0. |
| 2026-01-26 | Program status tracking | **`context.status` + `context.userLogs`** | Track program state and user-facing logs in ExecutionContext for v0.5. |

## Scope

**In scope:**
- Express backend with POST /respond endpoint
- React frontend with approve/reject buttons
- Resource display (image, video, PDF, YouTube/Vimeo embed)
- Package exports for LocalAppletLauncher integration
- API tests (supertest) and E2E tests (Playwright)
- **`@human/confirm` command handler** (runtime integration)
- **ExecutionContext changes** (`userLogs`, `status`, `appletLauncher`)
- **End-to-end integration tests** with LocalRunner + Playwright

**Out of scope:**
- Authentication (applets are local-only for v0.5)
- Styling customization (default theme only)
- Internationalization
- Mobile-specific layouts
- Auto-opening browser (user opens URL manually)

## Requirements

### Package Setup

**Last updated:** 2026-01-26
**Test:** `yarn workspace @massivoto/applet-confirm build`
**Progress:** 3/3 (100%)

- [x] R-CONFIRM-01: Create `applets/confirm/package.json` with name `@massivoto/applet-confirm`
- [x] R-CONFIRM-02: Configure Vite build for frontend in `front/` directory
- [x] R-CONFIRM-03: Export `definition`, `createServer`, and `frontendDir` from package entry point

### Backend

**Last updated:** 2026-01-26
**Test:** `npx vitest run applets/confirm/src/`
**Progress:** 4/4 (100%)

- [x] R-CONFIRM-21: Implement Express server with `createServer(config)` factory
- [x] R-CONFIRM-22: Implement `GET /` serving the React frontend (static files from `frontendDir`)
- [x] R-CONFIRM-23: Implement `GET /api/input` returning the input data for the frontend
- [x] R-CONFIRM-24: Implement `POST /respond` accepting `{ approved: boolean }` and calling `onResponse` callback

### Frontend

**Last updated:** 2026-01-26
**Test:** `npx playwright test applets/confirm/`
**Progress:** 5/5 (100%)

- [x] R-CONFIRM-41: Create React app with Vite in `front/` directory
- [x] R-CONFIRM-42: Fetch input data from `GET /api/input` on mount
- [x] R-CONFIRM-43: Display title (or "Confirmation" default) and message
- [x] R-CONFIRM-44: Render Approve and Reject buttons
- [x] R-CONFIRM-45: POST to `/respond` with `{ approved: true/false }` on button click

### Resource Display

**Last updated:** 2026-01-26
**Test:** `npx playwright test applets/confirm/`
**Progress:** 4/4 (100%)

- [x] R-CONFIRM-61: Implement `getResourceType(url)` to detect image/video/audio/pdf/embed from URL
- [x] R-CONFIRM-62: Render `<img>` for image URLs (jpg, png, gif, webp, svg)
- [x] R-CONFIRM-63: Render `<video controls>` for video URLs (mp4, webm) and `<audio controls>` for audio
- [x] R-CONFIRM-64: Render `<iframe>` for PDF and YouTube/Vimeo embed URLs

### Testing

**Last updated:** 2026-01-26
**Test:** `yarn workspace @massivoto/applet-confirm test`
**Progress:** 4/4 (100%)

- [x] R-CONFIRM-81: API tests with supertest: GET /api/input returns input, POST /respond triggers callback
- [x] R-CONFIRM-82: E2E tests with Playwright: load page, verify message displayed, click Approve
- [x] R-CONFIRM-83: E2E tests: click Reject, verify response sent
- [x] R-CONFIRM-84: E2E tests: verify resource (image) is displayed when resourceUrl provided

### Runtime Integration

**Last updated:** 2026-01-26
**Test:** `npx vitest run packages/runtime/src/interpreter/core-handlers/human/`
**Progress:** 0/6 (0%)

- [ ] R-CONFIRM-101: Create `@human/confirm` command handler in `packages/runtime/src/interpreter/core-handlers/human/confirm.handler.ts`
- [ ] R-CONFIRM-102: Handler validates required `message` argument, optional `title` and `resourceUrl`
- [ ] R-CONFIRM-103: Handler retrieves `appletLauncher` from `context.appletLauncher`, throws if not configured
- [ ] R-CONFIRM-104: Handler calls `appletLauncher.launch('confirm', input, context)` and logs the instance URL
- [ ] R-CONFIRM-105: Handler sets `context.status = 'waitingHumanValidation'` before waiting, restores to `'running'` after
- [ ] R-CONFIRM-106: Handler calls `instance.waitForResponse()`, extracts `approved: boolean`, returns as `value` for output variable

### ExecutionContext Changes

**Last updated:** 2026-01-26
**Test:** `npx vitest run packages/runtime/src/domain/`
**Progress:** 0/4 (0%)

These changes are prerequisites for runtime integration.

- [ ] R-CONFIRM-121: Add `userLogs: string[]` field to `ExecutionContext` interface
- [ ] R-CONFIRM-122: Add `status: 'running' | 'waitingHumanValidation' | 'finished' | 'error'` field to `ExecutionContext`
- [ ] R-CONFIRM-123: Add `appletLauncher?: AppletLauncher` field to `ExecutionContext` interface
- [ ] R-CONFIRM-124: Update `@utils/log` handler to append message to `context.userLogs[]` (in addition to console.log)

### End-to-End Integration

**Last updated:** 2026-01-26
**Test:** `npx playwright test packages/runtime/src/runner/e2e/`
**Progress:** 0/5 (0%)

These tests validate the full flow from ROADMAP acceptance criteria.

**Prerequisites:** Before implementing E2E tests, ensure these handlers pass their unit tests:
- `packages/runtime/src/interpreter/core-handlers/utils/set.spec.ts`
- `packages/runtime/src/interpreter/core-handlers/utils/log.handler.spec.ts`

- [ ] R-CONFIRM-141: Create E2E test file `packages/runtime/src/runner/e2e/confirm-applet.e2e.spec.ts`
- [ ] R-CONFIRM-142: Test executes OTO script: `@utils/set input="The fox jumps lazy" output=message` followed by `@human/confirm message="Do you confirm tweet?"` followed by `@utils/log message={"user said: "+confirmation}`
- [ ] R-CONFIRM-143: Test uses Playwright to open the applet URL and click "Approve", verifies `context.userLogs` contains "user said: true"
- [ ] R-CONFIRM-144: Test uses Playwright to click "Reject", verifies `context.userLogs` contains "user said: false"
- [ ] R-CONFIRM-145: Test verifies LocalRunner logs the applet URL to stdout/stderr for user to open

## Implementation

### Package Structure

```
applets/confirm/
├── package.json              # @massivoto/applet-confirm
├── tsconfig.json
├── vite.config.ts            # Builds front/ to dist/front/
├── confirm.prd.md            # This file
├── src/
│   ├── index.ts              # Package entry: export { definition, createServer, frontendDir }
│   ├── definition.ts         # AppletDefinition with schemas
│   ├── server.ts             # Express factory
│   ├── server.spec.ts        # API tests
│   └── resource-type.ts      # getResourceType utility
├── front/
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx           # Main component
│   │   ├── App.spec.tsx      # Component tests
│   │   └── ResourceDisplay.tsx
│   └── ...
├── e2e/
│   └── confirm.spec.ts       # Playwright tests
└── dist/                     # Build output
    ├── index.js
    └── front/                # Built React app
```

### Input/Output Schemas

```typescript
// Input (updated with resourceUrl)
const inputSchema = z.object({
  message: z.string(),
  title: z.string().optional(),
  resourceUrl: z.string().url().optional(),
})

// Output
const outputSchema = z.object({
  approved: z.boolean(),
})
```

**Note:** CoreAppletsBundle in kit needs to be updated to include `resourceUrl` in confirm schema.

### Server Factory

```typescript
// src/server.ts
import express from 'express'
import path from 'path'

interface CreateServerConfig {
  input: { message: string; title?: string; resourceUrl?: string }
  onResponse: (data: { approved: boolean }) => void
}

export function createServer(config: CreateServerConfig): express.Express {
  const app = express()
  app.use(express.json())

  // Serve frontend
  app.use(express.static(frontendDir))

  // API: get input data
  app.get('/api/input', (req, res) => {
    res.json(config.input)
  })

  // API: receive response
  app.post('/respond', (req, res) => {
    const { approved } = req.body
    config.onResponse({ approved })
    res.json({ ok: true })
  })

  return app
}

export const frontendDir = path.join(__dirname, 'front')
```

### Resource Type Detection

```typescript
// src/resource-type.ts
export type ResourceType = 'image' | 'video' | 'audio' | 'pdf' | 'embed' | 'unknown'

export function getResourceType(url: string): ResourceType {
  const lower = url.toLowerCase()

  if (/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(lower)) return 'image'
  if (/\.(mp4|webm|ogv)(\?.*)?$/i.test(lower)) return 'video'
  if (/\.(mp3|wav|ogg|m4a)(\?.*)?$/i.test(lower)) return 'audio'
  if (/\.pdf(\?.*)?$/i.test(lower)) return 'pdf'
  if (/youtube\.com\/watch|youtu\.be\/|vimeo\.com\/\d+/.test(lower)) return 'embed'

  return 'unknown'
}

export function toEmbedUrl(url: string): string {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`

  return url
}
```

### React Component

```tsx
// front/src/App.tsx
function App() {
  const [input, setInput] = useState<Input | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetch('/api/input').then(r => r.json()).then(setInput)
  }, [])

  const handleResponse = async (approved: boolean) => {
    await fetch('/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved }),
    })
    setSubmitted(true)
  }

  if (!input) return <div>Loading...</div>
  if (submitted) return <div>Response submitted. You can close this window.</div>

  return (
    <div className="confirm-container">
      <h1>{input.title || 'Confirmation'}</h1>
      {input.resourceUrl && <ResourceDisplay url={input.resourceUrl} />}
      <p>{input.message}</p>
      <div className="buttons">
        <button onClick={() => handleResponse(false)}>Reject</button>
        <button onClick={() => handleResponse(true)}>Approve</button>
      </div>
    </div>
  )
}
```

### ExecutionContext Changes

```typescript
// packages/runtime/src/domain/execution-context.ts

export interface ExecutionContext {
  env: Record<string, string>
  data: SerializableObject
  scopeChain: ScopeChain
  extra: any
  meta: {
    tool?: string
    updatedAt: ReadableDate
  }
  user: {
    id: string
    extra: SerializableObject
  }
  store: SerializableStorePointer
  storeProvider?: StoreProvider
  prompts: string[]

  // NEW: Runtime services (v0.5)
  appletLauncher?: AppletLauncher

  // NEW: Program tracking
  userLogs: string[]
  status: 'running' | 'waitingHumanValidation' | 'finished' | 'error'
}
```

### @human/confirm Command Handler

```typescript
// packages/runtime/src/interpreter/core-handlers/human/confirm.handler.ts

import { ActionResult } from '../../handlers/action-result.js'
import { CommandHandler } from '../../handlers/command-registry.js'
import { ExecutionContext } from '../../../domain/index.js'

export class ConfirmHandler implements CommandHandler<boolean> {
  readonly id = '@human/confirm'
  readonly type = 'command' as const

  async init(): Promise<void> {}
  async dispose(): Promise<void> {}

  async run(
    args: Record<string, any>,
    context: ExecutionContext,
  ): Promise<ActionResult<boolean>> {
    const { message, title, resourceUrl } = args

    // Validate required argument
    if (!message) {
      return {
        success: false,
        fatalError: 'Message is required',
        messages: ['Missing required argument: message'],
        cost: 0,
      }
    }

    // Check for appletLauncher
    if (!context.appletLauncher) {
      return {
        success: false,
        fatalError: 'AppletLauncher not configured',
        messages: ['Cannot launch confirm applet: appletLauncher not available in context'],
        cost: 0,
      }
    }

    // Launch the applet
    const input = { message, title, resourceUrl }
    const instance = await context.appletLauncher.launch('confirm', input, context)

    // Log URL for user to open
    console.log(`[APPLET] Waiting for human validation at: ${instance.url}`)

    // Update status
    const previousStatus = context.status
    context.status = 'waitingHumanValidation'

    try {
      // Wait for user response
      const response = await instance.waitForResponse<{ approved: boolean }>()

      // Restore status
      context.status = previousStatus ?? 'running'

      return {
        success: true,
        value: response.approved,  // boolean: true or false
        messages: [`User responded: ${response.approved ? 'Approved' : 'Rejected'}`],
        cost: 0,
      }
    } catch (error) {
      context.status = 'error'
      return {
        success: false,
        fatalError: error instanceof Error ? error.message : 'Unknown error',
        messages: ['Applet response failed'],
        cost: 0,
      }
    } finally {
      // Clean up
      await instance.terminator.terminate()
    }
  }
}
```

### Updated @utils/log Handler

```typescript
// packages/runtime/src/interpreter/core-handlers/utils/log.handler.ts
// Updated to write to context.userLogs

async run(
  args: Record<string, any>,
  context: ExecutionContext,
): Promise<ActionResult<void>> {
  const message = args.message
  if (message === undefined || message === null) {
    return {
      success: false,
      fatalError: 'Message is required',
      messages: ['Missing required argument: message'],
      cost: 0,
    }
  }
  const messageStr = String(message)

  // Log to console (existing behavior)
  console.log(`[LOG] ${messageStr}`)

  // NEW: Append to userLogs
  if (context.userLogs) {
    context.userLogs.push(messageStr)
  }

  return {
    success: true,
    messages: [`Logged: ${messageStr}`],
    cost: 0,
  }
}
```

### E2E Test Example

```typescript
// packages/runtime/src/runner/e2e/confirm-applet.e2e.spec.ts

import { test, expect } from '@playwright/test'
import { FileRunner } from '../file-runner.js'
import { LocalAppletLauncher } from '../../applets/local/local-applet-launcher.js'
import { fromPartialContext } from '../../domain/index.js'

test.describe('Confirm Applet E2E', () => {
  test('user approves confirmation and result is logged', async ({ page }) => {
    // Create runner with applet launcher
    const runner = new FileRunner({
      appletLauncher: new LocalAppletLauncher({ registry: coreAppletsRegistry }),
    })

    // Create context with userLogs initialized
    const context = fromPartialContext({
      userLogs: [],
      status: 'running',
    })

    // Start execution in background (will pause at @human/confirm)
    const resultPromise = runner.runFile('test-fixtures/confirm-test.oto', { context })

    // Wait for applet URL to be logged (poll or event)
    const appletUrl = await waitForAppletUrl()

    // Use Playwright to interact with applet
    await page.goto(appletUrl)
    await page.click('button:has-text("Approve")')

    // Wait for execution to complete
    const result = await resultPromise

    // Verify userLogs contains expected message
    expect(result.context.userLogs).toContainEqual(expect.stringContaining('user said: true'))
  })
})
```

## Dependencies

- **Depends on:**
  - `@massivoto/kit` (AppletDefinition type)
  - `express` (backend)
  - `vite` + `react` (frontend)
  - `zod` (schema validation)
  - `@utils/set` handler - must pass tests before E2E integration
  - `@utils/log` handler - must pass tests before E2E integration
  - `LocalAppletLauncher` - for spawning applet instances
  - `FileRunner` - for executing OTO files in E2E tests

- **Blocks:**
  - Grid applet (will follow same pattern)
  - Generation applet
  - Full v0.5 local execution workflow

## Open Questions

- [ ] Should we add a "loading" state while POST /respond is in flight?
- [ ] Should unknown resourceUrl types be ignored or shown as a link?

## Acceptance Criteria

### Theme

> **Theme:** Social Media Automation
>
> Reused from: [local-applet-launcher.prd.md](../../packages/runtime/src/applets/local/local-applet-launcher.prd.md)
>
> Test scenarios use content approval workflows where human reviewers validate
> AI-generated social media posts before publishing.

### Criteria (Applet Component)

- [x] AC-CONFIRM-01: Given Emma launches a confirm applet with message "Publish this tweet?",
      when the page loads, then she sees the title "Confirmation" and the message text
- [x] AC-CONFIRM-02: Given Carlos sees a confirm applet with an image resourceUrl,
      when the page loads, then the image is displayed above the message
- [x] AC-CONFIRM-03: Given Emma clicks the "Approve" button,
      when the request completes, then `waitForResponse()` resolves with `{ approved: true }`
- [x] AC-CONFIRM-04: Given Carlos clicks the "Reject" button,
      when the request completes, then `waitForResponse()` resolves with `{ approved: false }`
- [ ] AC-CONFIRM-05: Given a confirm applet with a YouTube resourceUrl,
      when the page loads, then the video is embedded and playable
- [ ] AC-CONFIRM-06: Given a confirm applet with a PDF resourceUrl,
      when the page loads, then the PDF is displayed in an iframe
- [x] AC-CONFIRM-07: Given the applet is spawned by LocalAppletLauncher,
      when using the package exports, then `createServer`, `definition`, and `frontendDir` are available

### Criteria (End-to-End - from ROADMAP v0.5)

These acceptance criteria come directly from ROADMAP.md "Applets confirm to work" section.

**Test OTO Script:**
```oto
@utils/set input="The fox jumps lazy" output=message
@human/confirm message="Do you confirm tweet? <br/> 'The fox jumps lazy'" output=confirmation
@utils/log message={"user said: "+confirmation}
```

- [ ] AC-CONFIRM-E2E-01: Given the LocalRunner executes the above OTO script,
      when the `@human/confirm` command is reached,
      then the runner logs the applet URL and sets `context.status = 'waitingHumanValidation'`
- [ ] AC-CONFIRM-E2E-02: Given Emma opens the applet URL in her browser and clicks "Approve",
      when the response is received,
      then `confirmation` is set to `true` and execution continues
- [ ] AC-CONFIRM-E2E-03: Given Carlos opens the applet URL and clicks "Reject",
      when the response is received,
      then `confirmation` is set to `false` and execution continues
- [ ] AC-CONFIRM-E2E-04: Given the script completes after user approval,
      then `context.userLogs` contains an entry with "user said: true"
- [ ] AC-CONFIRM-E2E-05: Given the script completes after user rejection,
      then `context.userLogs` contains an entry with "user said: false"

### General

- [x] All automated tests pass (vitest + playwright)
- [ ] Edge cases covered in `*.edge.spec.ts` files
- [ ] E2E tests are automatable with Playwright (no manual browser interaction required)
