# Massivoto Integrations — Foundations

## Purpose

This repo is the Foundations phase of the Massivoto Integrations frontend.  
It delivers a React + Vite baseline with strict TypeScript, unit/a11y testing, Storybook, and an end-to-end mocked data
layer so future features can ship safely.

## Key Commands

```sh
# install dependencies
npm install

# start the Vite dev server on http://localhost:5173
npm run dev

# run type-checking and unit tests (Vitest + RTL + mock server)
npm run test

# watch tests while coding
npm run test:watch

# launch Storybook 10 on http://localhost:6006
npm run storybook

# build the Storybook static bundle
npm run build-storybook

# run the a11y regression suite
npm run check:a11y

# lint and format
npm run lint
npm run format
```

## No-Network Contract

- **Zero live requests**: every `fetch` is intercepted by the mock server (`src/mocks/http/server.ts`). Any attempt to
  reach the network throws so we never touch real APIs during Foundations.
- **Single source of truth**: components, stories, and tests must read data from `src/mocks/fixtures/` or generators in
  `src/mocks/generators/`.
- **Handlers required**: when you introduce a new endpoint, create a handler in `src/mocks/http/handlers.ts`. If Vitest
  or the app hits an unhandled route, the server will error—fix that by adding the missing mock rather than allowing
  network access.

### Adding or Updating Fixtures

1. Drop the JSON (or TS helper) into the relevant folder under `src/mocks/fixtures/`. Keep the structure small and
   representative.
2. Export or import it inside `src/mocks/http/handlers.ts` to respond to mocked routes.
3. Re-run `npm run test` and `npm run storybook -- --smoke-test --ci` to confirm nothing attempts a real network call.
4. If the shape changes, update any stories/tests consuming the fixture so they still reflect the mocked contract.

## Fixtures & Mocks

- Static fixtures live in `src/mocks/fixtures/`, grouped by domain (`providers/…`).
- HTTP handlers reside in `src/mocks/http/handlers.ts`; add new entries there when you need additional endpoints.
- Use `src/mocks/generators/tokens.ts` for helper functions that create fake tokens.
- Unit tests automatically start and stop the mock server via `src/tests/setup.ts`—no extra boilerplate required.

To extend fixtures for UI-only scenarios (no new HTTP handler):

1. Import the fixture directly in your component, story, or test (
   `import providerList from '@/mocks/fixtures/providers/providerList.json'`).
2. Keep mock data small and readable—prefer 2-3 entries rather than full datasets.

## Editor Tips

- Enable “format on save” with Prettier. Our repo ships with `.prettierrc` (`semi: false`, `singleQuote: true`,
  `trailingComma: 'all'`, `printWidth: 100`).
- VS Code: install the official Prettier extension, set `"editor.formatOnSave": true`, and
  `"editor.defaultFormatter": "esbenp.prettier-vscode"`.
- Consider the ESLint extension for instant feedback; run `npm run lint` before committing.

---

Foundations Definition of Done:

- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run check:a11y` passes
- [ ] `npm run storybook` launches without console errors
- [ ] No feature depends on real network calls; all data flows through mocks/fixtures  
