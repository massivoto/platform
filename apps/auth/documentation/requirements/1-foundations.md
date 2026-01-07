Here’s a **Lovable-ready PRD** for the **FOUNDATIONS** phase only.
It’s written to be pasted into Lovable as your source of truth.
All external interactions are **mocked**; no remote services, no auth, no SDKs.

---

Note: No NextJS, but Vite + React + React-router

# PRD — FOUNDATIONS (for Lovable.dev, Next.js Pages Router)

## Goal

Set up a clean, testable, accessible, and fully mocked Next.js (Pages Router) project to serve as the base for the
Integrations app. This phase installs and configures formatting, linting, unit testing, basic a11y testing helpers,
Storybook, a shared mocks/fixtures system, and a simple example UI to validate the toolchain.

> **Strict rule:** Everything must be **mocked**. No Supabase, no Google Auth, no Slack/AWS/OpenAI calls. Provide
> fixtures and test doubles instead.

---

## Target Tech

* Next.js (Pages Router) + React 18
* TypeScript
* Prettier, ESLint (with jsx-a11y)
* Vitest + React Testing Library (RTL)
* Storybook (React/TS)
* Lightweight a11y testing helper (axe-core or jest-axe via vitest)
* Node/Yarn scripts
* Folder scaffolding for **mocks/fixtures**

---

## Expected Project Tree (high level)

```
apps/integrations/
  pages/
    index.tsx
    _app.tsx
  components/
    ExampleCard.tsx
  styles/
    globals.css
  .eslintrc.cjs
  .prettierrc
  tsconfig.json
  package.json
  vite.config.ts                # for Vitest
  vitest.config.ts
  playwright.config.ts          # placeholder (no remote deps)
  .storybook/
    main.ts
    preview.ts
  stories/
    ExampleCard.stories.tsx
  tests/
    unit/
      ExampleCard.test.tsx
    utils/
      a11y.ts                   # axe-core / jest-axe helper
  mocks/
    http/
      handlers.ts               # MSW-style handlers (local, no network)
      server.ts                 # test server setup for unit
    fixtures/
      providers/
        openai.token.json       # example fake token
        gmail.token.json        # example fake token
      ui/
        providerList.json       # example list used in stories/tests
    generators/
      tokens.ts                 # helper to produce fake tokens
```

> If Lovable prefers a single-app root, keep the same structure at the project root.

---

## Requirements

### **TOOLING & SCRIPTS**

**R-FOUNDATION-01:** The project uses **Next.js (Pages Router)** with TypeScript enabled. Create `pages/index.tsx`
rendering a minimal “Foundations OK” screen.

**R-FOUNDATION-02:** Add **package.json scripts**:

* `dev` (next dev)
* `build` (next build)
* `start` (next start)
* `lint` (eslint .)
* `format` (prettier --write .)
* `test` (vitest run)
* `test:watch` (vitest)
* `storybook` (start-storybook)
* `build-storybook`
* `check:a11y` (vitest -t a11y or specific command using the helper)

**R-FOUNDATION-03:** Provide **TypeScript strict mode**: `"strict": true`, `"noUncheckedIndexedAccess": true`, and path
aliases if needed (e.g., `@/components/*`, `@/mocks/*`, `@/tests/*`).

**R-FOUNDATION-04:** Add a minimal **ExampleCard** component in `components/ExampleCard.tsx` used by the home page and
Storybook.


---

### **FORMAT & LINT**

**R-FOUNDATION-21:** Install and configure **Prettier**. Include `.prettierrc` with sane defaults (semi: true,
singleQuote: true, trailingComma: 'all', printWidth: 100).

**R-FOUNDATION-22:** Install and configure **ESLint** with:

* `eslint:recommended`, `plugin:@typescript-eslint/recommended`, `plugin:react/recommended`,
  `plugin:react-hooks/recommended`, `plugin:jsx-a11y/recommended`.
* Type-aware rules where applicable.

**R-FOUNDATION-23:** Add an **ESLint rule set** for clean React:

* Disallow unused vars (TS-aware).
* Enforce exhaustive deps for hooks.
* Disallow `any` (warn) and enforce explicit return types (warn).

**R-FOUNDATION-24:** Add **format on save** instructions (editorconfig or VSCode settings recommended in README).

---

### **UNIT TESTS (VITEST + RTL)**

**R-FOUNDATION-41:** Install **Vitest** + **React Testing Library** + **@testing-library/jest-dom**. Provide
`vitest.config.ts` with jsdom environment.

**R-FOUNDATION-42:** Add `ExampleCard.spec.tsx`:

* Renders the component
* Asserts accessible role/name
* Snapshot-free; use queries (`getByRole`, `getByText`).

**R-FOUNDATION-43:** Expose a **testing entry** for custom render with RTL (e.g., a `renderWithProviders` helper if
needed later), but keep it minimal now.


---

### **A11Y TEST HELPER**

**R-FOUNDATION-61:** Create `tests/utils/a11y.ts` that exports a function `expectAccessible(ui: ReactElement)` which:

* Renders the element
* Runs `axe` (axe-core or jest-axe)
* Fails the test if violations are found

> Use vitest-compatible setup.

**R-FOUNDATION-62:** Add a dedicated test (e.g., `ExampleCard.a11y.test.tsx`) that uses
`expectAccessible(<ExampleCard .../>)`.

**R-FOUNDATION-63:** Add `yarn check:a11y` script that runs the a11y tests.

---

### **STORYBOOK**

**R-FOUNDATION-81:** Install and configure **Storybook** for React + TypeScript:

* `.storybook/main.ts` (framework: `@storybook/react-vite` or `@storybook/nextjs` if supported by Lovable)
* `.storybook/preview.ts` with global styles.

**R-FOUNDATION-82:** Add `stories/ExampleCard.stories.tsx` with two stories (default, with props variations).
No network; reads from `mocks/fixtures/ui/providerList.json` if needed.

**R-FOUNDATION-83:** Storybook must run with **no external errors** and hot reload.

---

### **MOCKS & FIXTURES**

**R-FOUNDATION-101:** Create a `mocks/fixtures/` directory holding **static JSON** used by examples/tests:

* `providers/providerList.json` (array of minimal provider stubs `{id,name,logo,about}`).
* `providers/openai.token.json` / `gmail.token.json` (fake tokens—SHOULD NOT look like real keys).

**R-FOUNDATION-102:** Create `mocks/generators/tokens.ts` with functions to build **fake token objects** (e.g.,
`fakeApiKeyToken('openai')`).

**R-FOUNDATION-103:** Create `mocks/http/handlers.ts` and `mocks/http/server.ts` compatible with **MSW-like** pattern (
no network); the server exports a `startTestServer()` and `stopTestServer()` used by Vitest setup.

**R-FOUNDATION-104:** Add a **Vitest setup file** to start/stop the mock server automatically for unit tests.

---

### **READMES & GUARANTEES**

**R-FOUNDATION-121:** Add a top-level **README** explaining:

* How to run dev, tests, storybook
* The **“all mocked”** policy in Foundations
* Where fixtures live and how to extend them
* Editor recommendations (format on save)

**R-FOUNDATION-122:** Document the **no-network contract** for Foundations and how to add new fixtures.

**R-FOUNDATION-123:** Provide a small **“Definition of Done”** checklist at the end of the README for this phase (lint
clean, tests passing, storybook running, a11y passing, no network).

---

## Acceptance Checklist (for Lovable output)

* Home page renders “Foundations OK”.
* `yarn lint`, `yarn format`, `yarn test`, `yarn storybook`, and `yarn check:a11y` all succeed.
* At least one unit test (ExampleCard) and one a11y test pass.
* Storybook runs and shows ExampleCard stories.
* No external network calls; fixtures and mocks are used exclusively.

---

## Notes to Lovable

* Generate a Next.js **Pages Router** app with the structure above.
* **Do not** scaffold or import auth/storage/network SDKs.
* Include **strict TypeScript** and **clean React** linting rules.
* Ensure **all examples** read from `mocks/fixtures` and **never** call the network.
* Keep the UI minimal and accessible (proper labels/roles).
* Prefer small, composable files over monoliths.

---

If you want, I can now generate the follow-up PRDs (BUILD, REGISTRY, TOKEN, OPEN_AI, CLIENT, SAVE_INDEX, SAVE_WS) in the
same format.
