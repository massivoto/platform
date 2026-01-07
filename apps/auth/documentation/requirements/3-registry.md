# PRD — REGISTRY (Provider contract + static registry now, dynamic later)

## Goal

Define a clean, testable **ProviderModule** contract (manifest + views + validator), and implement a **registry** that
lists and locates providers. For this phase we use a **static import** registry (from local files/fixtures). We also
scaffold the future **dynamic discovery** (lazy import + keyword) without enabling real package discovery yet.

---

## Target Tech

* TypeScript (strict)
* React 18
* Vite
* React Router (pages already scaffolded in BUILD)
* Zod for manifest/token validation (all local)
* Vitest + RTL for unit tests (no network)

---

## Expected Project Tree (additions to BUILD)

```
apps/integrations/
  src/
    lib/
      registry/
        index.ts               # public API: listProviders, getProvider, loadProviderModule
        static-registry.ts     # static array + helpers
        dynamic-loader.ts      # (scaffold) lazy import by id (mocked)
        manifest.schema.ts     # zod ProviderManifest schema
        token.schema.ts        # zod Token schema
      types.ts                 # shared ProviderStub, etc.
    routes/
      home/HomePage.tsx        # lists providers via registry
      providers/ProviderConnectPage.tsx
      providers/ProviderSettingsPage.tsx
  mocks/
    fixtures/
      providers/providerList.json
      providers/openai.manifest.json      # optional: manifest fixture for tests
      providers/openai.token.json
  tests/
    unit/registry/
      registry.static.test.ts
      manifest.schema.test.ts
      dynamic-loader.test.ts             # tests the scaffold with mocked imports

packages/
  integration-sdk/
    src/types.ts                 # ProviderModule, ProviderManifest, Token
    index.ts
  providers/
    openai/
      index.tsx                  # exports default ProviderModule (mock Connect/Settings)
      manifest.ts                # exports manifest object (imported by index)
      README.md
```

---

## Requirements

### CONTRACT: Provider types & schemas

**R-REG-01:** Create `packages/integration-sdk/src/types.ts` with the minimal SDK types:

```ts
export type Token =
    | { type: 'apiKey'; key: string }
    | { type: 'oauth'; accessToken: string; refreshToken?: string; expiry?: number; scopes?: string[] };

export type ProviderManifest = {
    id: string;                // e.g. "openai"
    name: string;              // display name
    logo: string;              // path to svg/png in /public/logos or data URL
    aboutMd: string;           // 3–10 lines markdown (safe content)
    kind: 'oauth' | 'apiKey';
    oauth?: { defaultScopes: string[]; supportsScopePicker?: boolean };
    capabilities?: string[];   // e.g., ['read', 'write', 'webhook']
    version?: string;          // semver (for future compatibility checks)
};

export type ProviderModule = {
    manifest: ProviderManifest;
    ConnectView: React.ComponentType;
    SettingsView: React.ComponentType;
    validateToken(token: Token): Promise<{ ok: true } | { ok: false; reason: string }>;
};
```

**R-REG-02:** Export these from `packages/integration-sdk/index.ts`.

**R-REG-03:** Create Zod schemas:

* `apps/integrations/src/lib/registry/manifest.schema.ts` → `ProviderManifestSchema`.
* `apps/integrations/src/lib/registry/token.schema.ts` → `TokenSchema` with discriminated union on `type`.

**R-REG-04:** Validation must be **sync** for manifest and **sync/shape-only** for tokens (we don’t call any remote
endpoint here).

---

### STATIC REGISTRY (current phase)

**R-REG-21:** Implement `apps/integrations/src/lib/registry/static-registry.ts`:

* Import the **OpenAI** provider module: `import openai from '../../../packages/providers/openai'` (adjust relative path
  or alias).
* Export `STATIC_REGISTRY: ProviderModule[] = [openai]`.

**R-REG-22:** Implement `apps/integrations/src/lib/registry/index.ts` (public API):

```ts
import {ProviderModule} from '@massivoto/integration-sdk';
import {ProviderManifestSchema} from './manifest.schema';
import {STATIC_REGISTRY} from './static-registry';

export function listProviders(): { id: string; name: string; logo: string; about: string }[] {
    return STATIC_REGISTRY.map(m => {
        const v = ProviderManifestSchema.parse(m.manifest);
        return {id: v.id, name: v.name, logo: v.logo, about: v.aboutMd};
    });
}

export function getProvider(id: string): ProviderModule | undefined {
    return STATIC_REGISTRY.find(m => m.manifest.id === id);
}
```

**R-REG-23:** `HomePage.tsx` must import `listProviders()` and render `ProviderCard` for each entry.

**R-REG-24:** `ProviderConnectPage.tsx` / `ProviderSettingsPage.tsx` must use `getProvider(id)` and render the module’s
views. If missing, render a friendly error (“Provider not found.”).

---

### DYNAMIC LOADER (scaffold for later)

**R-REG-41:** Create `apps/integrations/src/lib/registry/dynamic-loader.ts`:

* Export `async function loadProviderModule(id: string): Promise<ProviderModule>` that **mock-lazy-loads** a module by
  id using a **switch** with dynamic `import()` (e.g.,
  `case 'openai': return (await import('.../providers/openai')).default;`).
* If id is unknown, throw a typed error (`new AppError('PROVIDER_NOT_FOUND', ...)`) from `lib/errors.ts`.

**R-REG-42:** Unit tests (`tests/unit/registry/dynamic-loader.test.ts`) must mock the dynamic import and verify:

* Known id resolves to a module with a valid manifest.
* Unknown id throws `PROVIDER_NOT_FOUND`.

**R-REG-43:** The app uses **static registry** by default (for simplicity and tree-shaking). Dynamic loader is **not**
wired to the UI yet; it’s just a future-proof scaffold.

---

### MANIFEST & MODULE: OpenAI demo

**R-REG-61:** In `packages/providers/openai/manifest.ts`, export a constant `manifest: ProviderManifest` with:

* `id: 'openai'`, `name: 'OpenAI'`, `logo: '/logos/openai.svg'`
* `aboutMd`: 3–10 lines; no HTML, only markdown text (safe).
* `kind: 'apiKey'`
* `capabilities: ['read', 'write']`
* `version: '0.1.0'`

**R-REG-62:** In `packages/providers/openai/index.tsx`, export **default** a `ProviderModule`:

* `manifest` imported from `./manifest`
* `ConnectView` and `SettingsView`: simple mocked components that render headings and placeholder text.
* `validateToken(token)` returns `{ ok: true }` if `token.type === 'apiKey' && token.key.trim().length > 0`; else
  `{ ok: false, reason: 'Invalid key' }`.

**R-REG-63:** Provide a minimal Storybook story (optional if Storybook was deferred) **or** add a unit test rendering
`ConnectView` in isolation.

---

### FIXTURES & LOGOS

**R-REG-81:** Ensure logo assets exist at `public/logos/openai.svg` (a simple placeholder SVG is acceptable).

**R-REG-82:** Add optional `mocks/fixtures/providers/openai.manifest.json` mirroring the manifest for **schema tests**,
but the actual app uses the TS `manifest.ts` export.

---

### ERRORS, LOGGING, A11Y HOOKS

**R-REG-101:** Extend `lib/errors.ts` with:

* `AppError` (message + code)
* Codes: `PROVIDER_NOT_FOUND`, `MANIFEST_INVALID`, `TOKEN_INVALID`
* A simple `asAppError(e)` type guard utility.

**R-REG-102:** `lib/logger.ts` must log:

* Registry load start/end
* Provider lookups (id, success/fail)
* Manifest validation errors (without sensitive data)

**R-REG-103:** All routed pages (`Connect`, `Settings`) must render an **accessible** alert region (`role="alert"`) when
a provider is not found or when a manifest is invalid.

---

### TESTS (unit only for this phase)

**R-REG-121:** `tests/unit/registry/manifest.schema.test.ts`:

* Valid manifest passes.
* Missing required fields fails with a readable error.

**R-REG-122:** `tests/unit/registry/registry.static.test.ts`:

* `listProviders` returns at least one entry (OpenAI).
* `getProvider('openai')` returns a module.
* `getProvider('nope')` returns `undefined`.

**R-REG-123:** `tests/unit/registry/dynamic-loader.test.ts`:

* Known id resolves; unknown id throws `PROVIDER_NOT_FOUND`.

> All tests run without network. Use local imports and in-memory doubles only.

---

## Deliverables

* `ProviderModule` contract + zod schemas (manifest & token).
* Static registry listing OpenAI.
* Public API: `listProviders()`, `getProvider(id)`, and future `loadProviderModule(id)`.
* Home page rendering OpenAI card from registry.
* Provider pages mounting `ConnectView` / `SettingsView` for OpenAI.
* Unit tests for schema validation, static registry, and dynamic loader scaffold.

---

## Acceptance

* Home page lists **OpenAI** with logo, name, and about snippet.
* Navigating to `/providers/openai/connect` and `/providers/openai/settings` renders the mocked views.
* Invalid provider id path shows an accessible error message.
* `yarn test` passes for all **registry** tests.
* No network calls; all data comes from local modules/fixtures.
* Codebase uses the shared contract from `integration-sdk`, and manifests pass zod validation.
