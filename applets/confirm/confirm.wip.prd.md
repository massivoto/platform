# PRD: Confirm Applet

**Status:** DRAFT
**Last updated:** 2026-01-22
**Target Version:** 0.5
**Location:** `applets/confirm/`

## Progress

| Section | Status | Progress |
|---------|--------|----------|
| Package Setup | ❌ Not Started | 0/3 |
| Backend | ❌ Not Started | 0/4 |
| Frontend | ❌ Not Started | 0/5 |
| Resource Display | ❌ Not Started | 0/4 |
| Testing | ❌ Not Started | 0/4 |
| Acceptance Criteria | ❌ Not Started | 0/7 |
| **Overall** | **DRAFT** | **0%** |

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

## Scope

**In scope:**
- Express backend with POST /respond endpoint
- React frontend with approve/reject buttons
- Resource display (image, video, PDF, YouTube/Vimeo embed)
- Package exports for LocalAppletLauncher integration
- API tests (supertest) and E2E tests (Playwright)

**Out of scope:**
- Authentication (applets are local-only for v0.5)
- Styling customization (default theme only)
- Internationalization
- Mobile-specific layouts

## Requirements

### Package Setup

**Last updated:** 2026-01-22
**Test:** `yarn workspace @massivoto/applet-confirm build`
**Progress:** 0/3 (0%)

- ❌ R-CONFIRM-01: Create `applets/confirm/package.json` with name `@massivoto/applet-confirm`
- ❌ R-CONFIRM-02: Configure Vite build for frontend in `front/` directory
- ❌ R-CONFIRM-03: Export `definition`, `createServer`, and `frontendDir` from package entry point

### Backend

**Last updated:** 2026-01-22
**Test:** `npx vitest run applets/confirm/src/`
**Progress:** 0/4 (0%)

- ❌ R-CONFIRM-21: Implement Express server with `createServer(config)` factory
- ❌ R-CONFIRM-22: Implement `GET /` serving the React frontend (static files from `frontendDir`)
- ❌ R-CONFIRM-23: Implement `GET /api/input` returning the input data for the frontend
- ❌ R-CONFIRM-24: Implement `POST /respond` accepting `{ approved: boolean }` and calling `onResponse` callback

### Frontend

**Last updated:** 2026-01-22
**Test:** `npx playwright test applets/confirm/`
**Progress:** 0/5 (0%)

- ❌ R-CONFIRM-41: Create React app with Vite in `front/` directory
- ❌ R-CONFIRM-42: Fetch input data from `GET /api/input` on mount
- ❌ R-CONFIRM-43: Display title (or "Confirmation" default) and message
- ❌ R-CONFIRM-44: Render Approve and Reject buttons
- ❌ R-CONFIRM-45: POST to `/respond` with `{ approved: true/false }` on button click

### Resource Display

**Last updated:** 2026-01-22
**Test:** `npx playwright test applets/confirm/`
**Progress:** 0/4 (0%)

- ❌ R-CONFIRM-61: Implement `getResourceType(url)` to detect image/video/audio/pdf/embed from URL
- ❌ R-CONFIRM-62: Render `<img>` for image URLs (jpg, png, gif, webp, svg)
- ❌ R-CONFIRM-63: Render `<video controls>` for video URLs (mp4, webm) and `<audio controls>` for audio
- ❌ R-CONFIRM-64: Render `<iframe>` for PDF and YouTube/Vimeo embed URLs

### Testing

**Last updated:** 2026-01-22
**Test:** `yarn workspace @massivoto/applet-confirm test`
**Progress:** 0/4 (0%)

- ❌ R-CONFIRM-81: API tests with supertest: GET /api/input returns input, POST /respond triggers callback
- ❌ R-CONFIRM-82: E2E tests with Playwright: load page, verify message displayed, click Approve
- ❌ R-CONFIRM-83: E2E tests: click Reject, verify response sent
- ❌ R-CONFIRM-84: E2E tests: verify resource (image) is displayed when resourceUrl provided

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

## Dependencies

- **Depends on:**
  - `@massivoto/kit` (AppletDefinition type)
  - `express` (backend)
  - `vite` + `react` (frontend)
  - `zod` (schema validation)

- **Blocks:**
  - Grid applet (will follow same pattern)
  - Generation applet

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

### Criteria

- [ ] AC-CONFIRM-01: Given Emma launches a confirm applet with message "Publish this tweet?",
      when the page loads, then she sees the title "Confirmation" and the message text
- [ ] AC-CONFIRM-02: Given Carlos sees a confirm applet with an image resourceUrl,
      when the page loads, then the image is displayed above the message
- [ ] AC-CONFIRM-03: Given Emma clicks the "Approve" button,
      when the request completes, then `waitForResponse()` resolves with `{ approved: true }`
- [ ] AC-CONFIRM-04: Given Carlos clicks the "Reject" button,
      when the request completes, then `waitForResponse()` resolves with `{ approved: false }`
- [ ] AC-CONFIRM-05: Given a confirm applet with a YouTube resourceUrl,
      when the page loads, then the video is embedded and playable
- [ ] AC-CONFIRM-06: Given a confirm applet with a PDF resourceUrl,
      when the page loads, then the PDF is displayed in an iframe
- [ ] AC-CONFIRM-07: Given the applet is spawned by LocalAppletLauncher,
      when using the package exports, then `createServer`, `definition`, and `frontendDir` are available
- [ ] All automated tests pass (vitest + playwright)
- [ ] Edge cases covered in `*.edge.spec.ts` files
