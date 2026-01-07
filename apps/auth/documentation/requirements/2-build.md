Here’s the **Lovable-ready PRD** for the **BUILD** phase, updated for **Vite + React + React Router** (no Next.js).
All interactions remain **mocked**. No remote services, no auth SDKs, no external APIs.

---

# PRD — BUILD (Vite + React + React Router)

## Goal

Scaffold a clean, testable React application using **Vite** and **React Router**, with a minimal but realistic route map
for the Integrations app. Provide a clear folder structure, base pages, shared layout, error boundaries, and
placeholders for future packages. **No network calls**; read-only examples use local fixtures.

---

## Target Tech

* Vite (React + TypeScript)
* React 18
* React Router v6.27+ (`createBrowserRouter` / `RouterProvider`)
* TypeScript strict
* Global styles via CSS (or CSS Modules)
* Local **mocks/fixtures** only

---

## Expected Project Tree (high level)

```
apps/integrations/
  index.html
  vite.config.ts
  tsconfig.json
  src/
    main.tsx
    app-router.tsx              # react-router config
    app-layout/
      RootLayout.tsx            # header/nav/main/footer + <Outlet />
      ErrorBoundary.tsx
      NotFound.tsx
    routes/
      home/
        HomePage.tsx
      providers/
        ProviderConnectPage.tsx    # /providers/:id/connect
        ProviderSettingsPage.tsx   # /providers/:id/settings
    components/
      ProviderCard.tsx
      TokenStateBadge.tsx
      ScopePicker.tsx
    lib/
      zod.ts
      errors.ts
      logger.ts
      registry.ts               # temp static registry stub (uses fixtures)
      types.ts
    styles/
      globals.css
  mocks/
    fixtures/
      providers/providerList.json
      providers/openai.token.json
      ui/copy.json              # any static strings for demo
    generators/
      tokens.ts
  package.json
  README.md

packages/                       # (placeholders for later phases)
  integration-sdk/              # empty scaffold + README
  massivoto-client/             # empty scaffold + README
  ui-token-getter/              # empty scaffold + README
  providers/
    openai/                     # empty scaffold + README
```

> If Lovable generates a single-root app, keep the **same structure under `src/`** and place `mocks/` at the project
> root.

---

## Requirements

### ROUTING & APP ENTRY

// **R-BUILD-01:** Initialize a **Vite React + TS** app under `apps/integrations/`. The dev server must start with
`yarn dev`.

// **R-BUILD-02:** Create `src/main.tsx` that mounts `<RouterProvider router={router} />` and imports
`styles/globals.css`.

**R-BUILD-03:** Define `src/app-router.tsx` using **React Router** `createBrowserRouter` with these routes:

* `/` → `HomePage`
* `/providers/:id/connect` → `ProviderConnectPage`
* `/providers/:id/settings` → `ProviderSettingsPage`
* A **catch-all** 404 handled by `NotFound`.

**R-BUILD-04:** Add `RootLayout` with semantic landmarks:

* `<header>`, `<nav>`, `<main role="main">`, `<footer>`
* Uses `<Outlet />` for nested routes.
* Includes a minimal top-nav with links to “Home” and a fake “Providers” list.

**R-BUILD-05:** Configure **error elements**:

* `ErrorBoundary` at the root (handles render errors and route errors).
* A dedicated `NotFound` page for unknown routes.

---

### PAGES (MOCKED, NO NETWORK)

**R-BUILD-21:** `HomePage.tsx`:

* Title “Integrations — Build OK”.
* Short paragraph explaining this is a mocked build.
* Render at least one `ProviderCard` built from local fixtures.

**R-BUILD-22:** `ProviderConnectPage.tsx`:

* Reads `:id` from route params.
* Displays the selected provider’s **name + logo** and a short text from fixtures.
* No token logic yet; include a placeholder panel “Connect flow will live here”.

**R-BUILD-23:** `ProviderSettingsPage.tsx`:

* Reads `:id` from route params.
* Displays provider name and a placeholder “Settings will live here”.

**R-BUILD-24:** Both provider pages must show a **breadcrumb** from DaisyUI (e.g., Home → Provider → Connect/Settings)
and a compact title area.

**R-BUILD-25:** All provider info (name/logo/about) is loaded **from `mocks/fixtures/providers/providerList.json`** via
a local import (not `fetch`).

---

### COMPONENTS (UI SCAFFOLD)

**R-BUILD-41:** `ProviderCard.tsx`:

* Props: `{ id: string; name: string; logo: string; about: string }`.
* Shows logo (img with `alt={name} logo`), name (heading), short about text (truncate).
* Contains two CTA links/buttons to **Connect** and **Settings** using React Router `<Link>` to the right route, with
  proper accessible names.

**R-BUILD-42:** `TokenStateBadge.tsx`:

* Presentational component with three visual states: “Not Connected”, “Connected”, “Error”.
* Accepts `state: 'idle' | 'connected' | 'error'`.
* No real token lookups here—just visuals and ARIA-friendly text.

**R-BUILD-43:** `ScopePicker.tsx`:

* Purely visual scaffold: shows a list of 3–5 mock scopes from fixtures or inline constant.
* Each scope has a toggle (checkbox or switch). No persistence yet.
* Include a “Reset to defaults” button (no-op for BUILD).
* Some scope for this provider are pre-checked. Some are mandatory.
* A scope can be disabled, selected, or not.
* By default, the mandatory scopes are pre-checked and disabled.

---

### LIB & TYPES

**R-BUILD-61:** `lib/types.ts` exports minimal shared types:

```ts
export type Provider = { id: string; name: string; logo: string; about: string; };
```

**R-BUILD-62:** `lib/registry.ts` exports a **static** in-memory registry sourced from
`mocks/fixtures/providers/providerList.json`, with:

```ts
export function listProviders(): Provider[];
export function getProvider(id: string): Provider | undefined;
```

Both functions must be **sync** and not perform any network I/O.

**R-BUILD-63:** `lib/zod.ts`, `lib/errors.ts`, `lib/logger.ts`:

* `zod.ts`: export Zod schema for `Provider` (for later validation).
* `errors.ts`: define `AppError` base class (message + code).
* `logger.ts`: simple console wrapper with `debug/info/warn/error` that no-ops in production.

---

### STYLES & A11Y MARKERS

**R-BUILD-81:** Create `styles/globals.css` with minimal resets and a base typography scale. Keep it simple and
readable.

**R-BUILD-82:** Each page has a top-level `<h1>` and key interactive elements carry roles and accessible names:

* Links/buttons have `aria-label` or visible text that is clear.
* Images include descriptive `alt`.

**R-BUILD-83:** Ensure keyboard focus is visible (CSS focus ring), and navigation is reachable via Tab.

---

### SCRIPTS & CONFIG

**R-BUILD-101:** `package.json` scripts (at `apps/integrations/`):

* `"dev": "vite"`
* `"build": "tsc -b && vite build"`
* `"preview": "vite preview"`
* `"lint": "eslint ."`
* `"format": "prettier --write ."`

> Testing/storybook scripts come from FOUNDATIONS; BUILD only requires dev/build/preview plus lint/format hooks.

**R-BUILD-102:** `vite.config.ts`:

* React plugin configured.
* Path aliases: `@/*` → `src/*`.

**R-BUILD-103:** `tsconfig.json`:

* `"strict": true`, `"noUncheckedIndexedAccess": true`.
* `paths` mirror Vite aliases.

---

### MOCKS & FIXTURES GUARANTEE

**R-BUILD-121:** Place provider fixtures at `mocks/fixtures/providers/providerList.json`, with at least **three**
entries, including **OpenAI**:

```json
[
  {"id":"openai","name":"OpenAI","logo":"/logos/openai.svg","about":"Mocked OpenAI provider."},
  {"id":"mailgun","name":"Mailgun","logo":"/logos/mailgun.svg","about":"Mocked Mailgun provider."},
  {"id":"gsheets","name":"Google Sheets","logo":"/logos/gsheets.svg","about":"Mocked Google Sheets provider."}
]
```

Logos can be placeholder SVGs in `public/logos/`.

**R-BUILD-122:** No code in BUILD performs **any** `fetch`/`XMLHttpRequest`/WebSocket. Everything reads from local
imports or constants.

**R-BUILD-123:** Add `mocks/generators/tokens.ts` with a stub:

```ts
export const fakeApiKeyToken = (providerId: string) => `pk_${providerId}_FAKE_${Math.random().toString(36).slice(2)}`;
```

(Not used yet, but ready for later phases.)

---

### PACKAGES PLACEHOLDERS (OPTIONAL BUT RECOMMENDED)

**R-BUILD-141:** Create empty `packages/` subfolders with a `README.md` each explaining they are placeholders for later
phases:

* `integration-sdk/`
* `massivoto-client/`
* `ui-token-getter/`
* `providers/openai/`

**R-BUILD-142:** Do **not** add build configs here yet; simple READMEs are enough to set expectations.

---

## Deliverables

* A **running Vite app** (`yarn dev`) rendering:

    * Root layout with header/nav/main/footer
    * Home page listing providers from fixtures via `ProviderCard`
    * Working navigation to `/providers/:id/connect` and `/providers/:id/settings`
* Static **registry** reading from local fixtures
* Components `ProviderCard`, `TokenStateBadge`, `ScopePicker` (visual only)
* ErrorBoundary and NotFound behavior

---

## Acceptance

* `yarn dev` starts without errors; navigating to `/`, `/providers/openai/connect`, and `/providers/openai/settings`
  works.
* Provider data appears from **fixtures** (no network).
* Layout is semantic (header/nav/main/footer), pages have `<h1>`, focus rings are visible.
* `yarn build` and `yarn preview` work without warnings.
* Lint and format scripts run successfully.
* The app remains entirely **mock-driven** in this phase.

---

## Notes to Lovable

* Generate a **Vite + React + TS** app under `apps/integrations/`.
* Use **React Router** with `createBrowserRouter`.
* **Do not** scaffold any remote data layers or auth.
* Import provider data from `mocks/fixtures/...` and wire through a tiny `registry.ts`.
* Keep components small, accessible, and composable.
* Provide placeholder logos in `public/logos/` (simple SVGs).
