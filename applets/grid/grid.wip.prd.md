# PRD: Grid Applet

**Status:** DRAFT
**Last updated:** 2026-01-27
**Target Version:** 0.5
**Location:** `applets/grid/`

## Progress

| Section | Status | Progress |
|---------|--------|----------|
| Package Setup | Not Started | 0/3 |
| Data Types | Not Started | 0/4 |
| Backend | Not Started | 0/5 |
| Frontend | Not Started | 0/6 |
| Testing | Not Started | 0/4 |
| Runtime Integration | Not Started | 0/4 |
| **Overall** | **DRAFT** | **0%** |

## Parent PRD

- [Applet Architecture](../../packages/kit/src/applets/applet.archi.md)

## Child PRDs

- None

## Context

The Grid applet is the second standard applet for Massivoto. It provides a multi-select UI for human validation checkpoints where users need to choose from a list of items. When an OTO program hits `@human/grid`, the LocalAppletLauncher spawns this applet, displays items in a grid with checkboxes, and waits for the user to select items and submit.

Unlike the confirm applet (approve/reject), the grid applet returns the full array of selected items. This enables workflows where:
- Users curate content from AI-generated options
- Users filter data before the next processing step
- Users select multiple items for batch operations

The grid applet is **pure selection** - it does not generate content. Content generation happens via `@ai/generate` commands before the grid step.

## Decision Log

| Date | Option | Decision | Rationale |
|------|--------|----------|-----------|
| 2026-01-27 | Generator in applet | **No - pure selection** | Keep concerns separated. Generation happens in @ai/generate command. Grid just displays and selects. |
| 2026-01-27 | Output format | **Full items array** | Return complete GridItem objects, not just IDs. Items may have been enriched by previous commands. |
| 2026-01-27 | Item identity | **Require `id` field** | Each GridItem must have a unique `id: string`. Explicit is better than auto-generated. |
| 2026-01-27 | Resource display | **Reuse from confirm** | Same `getResourceType` and `ResourceDisplay` component patterns. |

## Scope

**In scope:**
- Express backend with POST /respond endpoint
- React frontend with grid layout and checkboxes
- Item display: text, resource (image/video/audio), metadata
- Package exports for LocalAppletLauncher integration
- API tests (supertest) and E2E tests (Playwright)
- `@human/grid` command handler (runtime integration)

**Out of scope:**
- Content generation (use `@ai/generate` before grid)
- Drag-and-drop reordering
- Pagination (v0.5 handles reasonable item counts)
- Search/filter within grid
- Custom item rendering templates

## Requirements

### Package Setup

**Last updated:** 2026-01-27
**Test:** `yarn workspace @massivoto/applet-grid build`
**Progress:** 0/3 (0%)

- [ ] R-GRID-01: Create `applets/grid/package.json` with name `@massivoto/applet-grid`
- [ ] R-GRID-02: Configure Vite build for frontend in `front/` directory
- [ ] R-GRID-03: Export `definition`, `createServer`, and `frontendDir` from package entry point

### Data Types

**Last updated:** 2026-01-27
**Test:** `npx vitest run applets/grid/src/`
**Progress:** 0/4 (0%)

- [ ] R-GRID-11: Define `GridItem` type with required `id: string` and `text: string`
- [ ] R-GRID-12: Add optional `resource?: { url: string; type?: 'image' | 'video' | 'audio' }` to GridItem
- [ ] R-GRID-13: Add optional `metadata?: Record<string, string>` to GridItem for key/value display
- [ ] R-GRID-14: Define `gridInputSchema` (items: GridItem[], title?: string) and `gridOutputSchema` (selected: GridItem[])

### Backend

**Last updated:** 2026-01-27
**Test:** `npx vitest run applets/grid/src/`
**Progress:** 0/5 (0%)

- [ ] R-GRID-21: Implement Express server with `createServer(config)` factory
- [ ] R-GRID-22: Implement `GET /` serving the React frontend (static files from `frontendDir`)
- [ ] R-GRID-23: Implement `GET /api/input` returning input data (items array, title)
- [ ] R-GRID-24: Implement `POST /respond` accepting `{ selected: string[] }` (array of selected item IDs)
- [ ] R-GRID-25: Server maps selected IDs back to full GridItem objects before calling `onResponse`

### Frontend

**Last updated:** 2026-01-27
**Test:** `npx playwright test applets/grid/`
**Progress:** 0/6 (0%)

- [ ] R-GRID-41: Create React app with Vite in `front/` directory
- [ ] R-GRID-42: Fetch input data from `GET /api/input` on mount
- [ ] R-GRID-43: Display title (or "Select Items" default) at top
- [ ] R-GRID-44: Render items in a responsive grid with checkbox for each item
- [ ] R-GRID-45: Display item text, resource (using ResourceDisplay component), and metadata key/values
- [ ] R-GRID-46: Render Submit button that POSTs selected item IDs to `/respond`

### Testing

**Last updated:** 2026-01-27
**Test:** `yarn workspace @massivoto/applet-grid test`
**Progress:** 0/4 (0%)

- [ ] R-GRID-61: API tests with supertest: GET /api/input returns items array
- [ ] R-GRID-62: API tests: POST /respond with selected IDs triggers callback with full items
- [ ] R-GRID-63: E2E tests with Playwright: load page, verify items displayed, select 2 items, submit
- [ ] R-GRID-64: E2E tests: verify response contains full GridItem objects (not just IDs)

### Runtime Integration

**Last updated:** 2026-01-27
**Test:** `npx vitest run packages/runtime/src/interpreter/core-handlers/human/`
**Progress:** 0/4 (0%)

- [ ] R-GRID-81: Create `@human/grid` command handler in `packages/runtime/src/interpreter/core-handlers/human/grid.handler.ts`
- [ ] R-GRID-82: Handler validates required `items` argument (array), optional `title`
- [ ] R-GRID-83: Handler launches grid applet, sets `context.status = 'waitingHumanValidation'`, waits for response
- [ ] R-GRID-84: Handler returns `selected: GridItem[]` array as `value` for output variable

## Implementation

### Package Structure

```
applets/grid/
├── package.json              # @massivoto/applet-grid
├── tsconfig.json
├── vite.config.ts            # Builds front/ to dist/front/
├── grid.wip.prd.md           # This file
├── src/
│   ├── index.ts              # Package entry: export { definition, createServer, frontendDir }
│   ├── definition.ts         # AppletDefinition with schemas
│   ├── server.ts             # Express factory
│   ├── server.spec.ts        # API tests
│   └── types.ts              # GridItem, GridInput, GridOutput types
├── front/
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx           # Main component with grid layout
│   │   ├── GridItem.tsx      # Single item component
│   │   └── ResourceDisplay.tsx  # Reused from confirm pattern
│   └── ...
├── e2e/
│   └── grid.spec.ts          # Playwright tests
└── dist/                     # Build output
    ├── index.js
    └── front/                # Built React app
```

### Input/Output Schemas

```typescript
// src/types.ts
import { z } from 'zod'

export const gridItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  resource: z.object({
    url: z.string().url(),
    type: z.enum(['image', 'video', 'audio']).optional(),
  }).optional(),
  metadata: z.record(z.string()).optional(),
})

export type GridItem = z.infer<typeof gridItemSchema>

// src/definition.ts
export const gridInputSchema = z.object({
  items: z.array(gridItemSchema).min(1),
  title: z.string().optional(),
})

export const gridOutputSchema = z.object({
  selected: z.array(gridItemSchema),
})

export type GridInput = z.infer<typeof gridInputSchema>
export type GridOutput = z.infer<typeof gridOutputSchema>
```

### Server Factory

```typescript
// src/server.ts
import express from 'express'
import path from 'path'
import type { GridItem, GridInput } from './types.js'

interface CreateServerConfig {
  input: GridInput
  onResponse: (data: { selected: GridItem[] }) => void
}

export function createServer(config: CreateServerConfig): express.Express {
  const app = express()
  app.use(express.json())

  // Health check
  app.get('/health', createHealthMiddleware('grid'))

  // Serve frontend
  app.use(express.static(frontendDir))

  // API: get input data
  app.get('/api/input', (req, res) => {
    res.json(config.input)
  })

  // API: receive response (IDs -> full items)
  app.post('/respond', (req, res) => {
    const { selected } = req.body  // string[] of IDs

    // Map IDs back to full items
    const selectedItems = config.input.items.filter(
      item => selected.includes(item.id)
    )

    config.onResponse({ selected: selectedItems })
    res.json({ ok: true })
  })

  return app
}

export const frontendDir = path.join(__dirname, 'front')
```

### React Components

```tsx
// front/src/App.tsx
function App() {
  const [input, setInput] = useState<GridInput | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetch('/api/input').then(r => r.json()).then(setInput)
  }, [])

  const toggleItem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async () => {
    await fetch('/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selected: Array.from(selectedIds) }),
    })
    setSubmitted(true)
  }

  if (!input) return <div>Loading...</div>
  if (submitted) return <div>Selection submitted. You can close this window.</div>

  return (
    <div className="grid-container">
      <h1>{input.title || 'Select Items'}</h1>
      <div className="grid">
        {input.items.map(item => (
          <GridItemCard
            key={item.id}
            item={item}
            selected={selectedIds.has(item.id)}
            onToggle={() => toggleItem(item.id)}
          />
        ))}
      </div>
      <div className="actions">
        <span>{selectedIds.size} selected</span>
        <button onClick={handleSubmit}>Submit Selection</button>
      </div>
    </div>
  )
}

// front/src/GridItemCard.tsx
function GridItemCard({ item, selected, onToggle }: Props) {
  return (
    <div
      className={`grid-item ${selected ? 'selected' : ''}`}
      onClick={onToggle}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
      />
      {item.resource && <ResourceDisplay url={item.resource.url} />}
      <div className="text">{item.text}</div>
      {item.metadata && (
        <dl className="metadata">
          {Object.entries(item.metadata).map(([k, v]) => (
            <Fragment key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </Fragment>
          ))}
        </dl>
      )}
    </div>
  )
}
```

### @human/grid Command Handler

```typescript
// packages/runtime/src/interpreter/core-handlers/human/grid.handler.ts

export class GridHandler implements CommandHandler<GridItem[]> {
  readonly id = '@human/grid'
  readonly type = 'command' as const

  async run(
    args: Record<string, any>,
    context: ExecutionContext,
  ): Promise<ActionResult<GridItem[]>> {
    const { items, title } = args

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return {
        success: false,
        fatalError: 'Items array is required and must not be empty',
        messages: ['Missing or invalid argument: items'],
        cost: 0,
      }
    }

    // Validate each item has id and text
    for (const item of items) {
      if (!item.id || !item.text) {
        return {
          success: false,
          fatalError: 'Each item must have id and text fields',
          messages: [`Invalid item: ${JSON.stringify(item)}`],
          cost: 0,
        }
      }
    }

    if (!context.appletLauncher) {
      return {
        success: false,
        fatalError: 'AppletLauncher not configured',
        messages: ['Cannot launch grid applet'],
        cost: 0,
      }
    }

    const input = { items, title }
    const instance = await context.appletLauncher.launch('grid', input, context)

    console.log(`[APPLET] Waiting for selection at: ${instance.url}`)

    const previousStatus = context.status
    context.status = 'waitingHumanValidation'

    try {
      const response = await instance.waitForResponse<{ selected: GridItem[] }>()
      context.status = previousStatus ?? 'running'

      return {
        success: true,
        value: response.selected,
        messages: [`User selected ${response.selected.length} items`],
        cost: 0,
      }
    } catch (error) {
      context.status = 'error'
      return {
        success: false,
        fatalError: error instanceof Error ? error.message : 'Unknown error',
        messages: ['Grid applet response failed'],
        cost: 0,
      }
    } finally {
      await instance.terminator.terminate()
    }
  }
}
```

## Dependencies

- **Depends on:**
  - `@massivoto/kit` (AppletDefinition type, createHealthMiddleware)
  - `express` (backend)
  - `vite` + `react` (frontend)
  - `zod` (schema validation)
  - `LocalAppletLauncher` - for spawning applet instances
  - `confirm applet` - reuse ResourceDisplay pattern

- **Blocks:**
  - Generation applet (may pass items through grid first)
  - Content curation workflows

## Open Questions

- [x] Should empty selection be allowed? **Yes - user can submit with 0 items selected**
- [ ] Should we show a "Select All" / "Deselect All" toggle?
- [ ] Max number of items before pagination needed?

## Acceptance Criteria

### Theme

> **Theme:** Social Media Automation
>
> Reused from: [confirm.prd.md](../confirm/confirm.done.prd.md)
>
> Test scenarios use content curation workflows where users select from
> AI-generated social media post options before publishing.

### Criteria

- [ ] AC-GRID-01: Given Emma launches a grid applet with 5 tweet options,
      when the page loads, then she sees all 5 items with checkboxes
- [ ] AC-GRID-02: Given Carlos clicks on an item card,
      when the checkbox toggles, then the item is visually highlighted as selected
- [ ] AC-GRID-03: Given Emma has selected 3 items and clicks Submit,
      when the response completes, then `waitForResponse()` resolves with the 3 full GridItem objects
- [ ] AC-GRID-04: Given an item has a resource URL (image),
      when the grid renders, then the image is displayed in the item card
- [ ] AC-GRID-05: Given an item has metadata `{ "author": "AI", "tone": "casual" }`,
      when the grid renders, then the metadata is displayed as key/value pairs
- [ ] AC-GRID-06: Given Carlos submits with no items selected,
      when the response completes, then `waitForResponse()` resolves with `{ selected: [] }`

### Criteria (OTO Integration)

**Test OTO Script:**
```oto
@utils/set input=[{id:"1",text:"Tweet A"},{id:"2",text:"Tweet B"},{id:"3",text:"Tweet C"}] output=tweets
@human/grid items=tweets title="Select tweets to publish" output=selectedTweets
@utils/log message={"Selected "+selectedTweets.length+" tweets"}
```

- [ ] AC-GRID-E2E-01: Given the LocalRunner executes the above OTO script,
      when the `@human/grid` command is reached,
      then the runner logs the applet URL and pauses execution
- [ ] AC-GRID-E2E-02: Given Emma opens the grid and selects items 1 and 3,
      when she clicks Submit,
      then `selectedTweets` contains the 2 full GridItem objects
- [ ] AC-GRID-E2E-03: Given the script completes,
      then `context.userLogs` contains "Selected 2 tweets"

### General

- [ ] All automated tests pass (vitest + playwright)
- [ ] Edge cases covered in `*.edge.spec.ts` files
- [ ] E2E tests are automatable with Playwright
