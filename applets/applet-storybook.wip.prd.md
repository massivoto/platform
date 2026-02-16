# PRD: Applet Storybook

**Status:** DRAFT
**Last updated:** 2026-02-15

> - DRAFT: Coding should not start, requirements being defined
> - APPROVED: Code can start, requirements stable
> - IMPLEMENTED: Tests passing, feature complete
> - ITERATING: Modifying existing code, PRD being updated

## Progress

| Section | Status | Progress |
|---------|--------|----------|
| Context | ✅ Complete | 100% |
| Scope | ✅ Complete | 100% |
| Requirements: Storybook Infrastructure | ❌ Not Started | 0/4 |
| Requirements: Prop Extraction Refactor | ❌ Not Started | 0/4 |
| Requirements: Confirm Applet Stories | ❌ Not Started | 0/3 |
| Requirements: Grid Applet Stories | ❌ Not Started | 0/4 |
| Requirements: Developer Ergonomics | ❌ Not Started | 0/3 |
| Acceptance Criteria | ❌ Not Started | 0/6 |
| Theme | ✅ Defined | - |
| **Overall** | **DRAFT** | **0%** |

## Parent PRD

- (none - standalone feature)

## Child PRDs

- (none)

## Context

Applets (confirm, grid, future generation) are temporary React+Express web apps deployed mid-workflow for human validation. Currently, the only way to visually test an applet is `yarn demo`, which boots the full Express backend, requires a build step, and shows a single hardcoded scenario.

This makes UI iteration slow and state exploration painful. A developer cannot quickly see: "What does the grid look like with 50 items? With no title? With broken image URLs? After submission?"

Storybook provides isolated component rendering with multiple scenarios, no backend required. Since applets share a common structure (React frontend, Express backend, same lifecycle), a shared Storybook at the applets level gives a unified catalog that scales to new applets with minimal effort.

The auth app already has its own Storybook (`@storybook/react-vite`). The applet Storybook is separate - different concern, different catalog.

## Decision Log

| Date | Option | Decision | Rationale |
|------|--------|----------|-----------|
| 2026-02-15 | MSW vs Prop extraction | **Prop extraction** | Components are small, extracting AppView is trivial, avoids MSW dependency, makes all future stories dead simple |
| 2026-02-15 | Shared vs Per-applet Storybook | **Shared at `applets/.storybook/`** | Single catalog, one config, easy to browse all applets, new applets auto-discovered |
| 2026-02-15 | Merge with auth Storybook | **Keep separate** | Different concerns (applets vs auth UI), cleaner boundaries |
| 2026-02-15 | Shared ResourceDisplay | **Duplicate for now** | Rule of three: extract to kit when 3rd applet (generation) arrives. Tracked in v1.0 roadmap |

## Scope

**In scope:**
- Shared Storybook config at `platform/applets/.storybook/`
- Prop extraction refactor: `App.tsx` -> `AppView.tsx` (presentational) + `App.tsx` (fetcher wrapper)
- Stories for all confirm applet components (AppView, ResourceDisplay)
- Stories for all grid applet components (GridView, GridItemCard, ResourceDisplay)
- `yarn storybook` script at applets workspace level
- Documentation for adding stories to new applets

**Out of scope:**
- Visual regression testing (Chromatic, Percy) - future enhancement
- Shared component library between applets - not needed yet
- "Standard Massivoto UI" shell/branding - separate roadmap item
- MSW or any fetch mocking library
- Storybook addons beyond docs (a11y, interactions - can add later)
- Auth app Storybook changes

## Requirements

### Storybook Infrastructure

**Last updated:** 2026-02-15
**Progress:** 0/4 (0%)

- ❌ R-SB-01: Create shared Storybook config at `platform/applets/.storybook/` using `@storybook/react-vite` framework, discovering stories from `../*/front/src/**/*.stories.tsx`
- ❌ R-SB-02: Create `platform/applets/package.json` workspace with `storybook` and `build-storybook` scripts
- ❌ R-SB-03: Preview config loads the correct applet CSS per-story using decorators that import the applet's `styles.css`
- ❌ R-SB-04: Storybook builds and starts without errors with `yarn storybook` from the applets directory

### Prop Extraction Refactor

**Last updated:** 2026-02-15
**Test:** `npx vitest run platform/applets/confirm/src && npx vitest run platform/applets/grid/src`
**Progress:** 0/4 (0%)

- ❌ R-SB-21: Extract `ConfirmView` from `confirm/front/src/App.tsx` - a pure presentational component accepting `input`, `onRespond`, `submitted`, `loading`, `error` as props
- ❌ R-SB-22: `confirm/front/src/App.tsx` becomes a thin wrapper: fetches from `/api/input`, manages state, renders `<ConfirmView>`
- ❌ R-SB-23: Extract `GridView` from `grid/front/src/App.tsx` - a pure presentational component accepting `input`, `selectedIds`, `onToggle`, `onSubmit`, `submitted`, `loading`, `error` as props
- ❌ R-SB-24: `grid/front/src/App.tsx` becomes a thin wrapper: fetches from `/api/input`, manages state, renders `<GridView>`

### Confirm Applet Stories

**Last updated:** 2026-02-15
**Progress:** 0/3 (0%)

- ❌ R-SB-41: `ConfirmView.stories.tsx` with stories: Default (title + message), WithResource (image URL), LongMessage (multiline text), Submitted (post-submit state), Error (error message displayed)
- ❌ R-SB-42: `ResourceDisplay.stories.tsx` with stories: Image, Video, Audio, UnknownUrl
- ❌ R-SB-43: All confirm stories render correctly with the confirm applet's `styles.css` loaded

### Grid Applet Stories

**Last updated:** 2026-02-15
**Progress:** 0/4 (0%)

- ❌ R-SB-61: `GridView.stories.tsx` with stories: Default (5 items), ManyItems (20+ items to test scroll/layout), Empty (0 items), WithTitle (custom title), AllSelected (all items pre-selected), Submitted
- ❌ R-SB-62: `GridItemCard.stories.tsx` with stories: TextOnly, WithImage, WithVideo, WithMetadata, Selected, Unselected, LongText
- ❌ R-SB-63: `ResourceDisplay.stories.tsx` with stories: Image, Video, Audio (grid version)
- ❌ R-SB-64: All grid stories render correctly with the grid applet's `styles.css` loaded

### Developer Ergonomics

**Last updated:** 2026-02-15
**Progress:** 0/3 (0%)

- ❌ R-SB-81: Add `storybook` script to root `platform/package.json` so `yarn storybook` works from platform root
- ❌ R-SB-82: Document in a `platform/applets/README.md` how to add stories for a new applet (3-step checklist: create component, add `*.stories.tsx`, import CSS in decorator)
- ❌ R-SB-83: Storybook dev server supports hot reload - changing a component or story file triggers instant update

## Dependencies

- **Depends on:** existing confirm and grid applet React components
- **Blocks:** future "Standard Massivoto UI" design work, future applets (generation) visual development

## Open Questions

- [x] ~~Should `ResourceDisplay` be extracted into a shared component between applets?~~ No - rule of three. Duplicate until the 3rd applet (generation) forces the merge. Tracked in v1.0 roadmap.

## Acceptance Criteria

### Theme

> **Theme:** Social Media Agency (reuses grid applet's existing tweet selection theme)
>
> The social media agency manages content for multiple clients. Emma is the content manager who reviews generated posts before publishing.

### Criteria

- [ ] AC-SB-01: Given Emma runs `yarn storybook` from `platform/applets/`, when the Storybook dev server starts, then she sees a sidebar listing both "Confirm" and "Grid" applet component groups
- [ ] AC-SB-02: Given Emma opens the GridView "ManyItems" story, when the page renders, then she sees 20+ item cards in a responsive CSS grid with checkboxes, without any backend running
- [ ] AC-SB-03: Given Emma opens the ConfirmView "WithResource" story, when the page renders, then she sees the confirmation message with an embedded image, Approve and Reject buttons styled correctly
- [ ] AC-SB-04: Given Emma opens a GridItemCard "WithMetadata" story, when the card renders, then she sees the item text plus key/value metadata pairs displayed below
- [ ] AC-SB-05: Given Emma modifies `GridItemCard.tsx` and saves, when Storybook is running in dev mode, then the story updates within 2 seconds without manual refresh
- [ ] AC-SB-06: Given a developer creates a new applet `generation/` with a `front/src/GenerationView.stories.tsx`, when they restart Storybook, then the new stories appear in the sidebar alongside confirm and grid - no config changes needed
- [ ] All automated tests pass (existing vitest + playwright tests unbroken by refactor)
- [ ] Edge cases covered in separate `*.edge.spec.ts` files
