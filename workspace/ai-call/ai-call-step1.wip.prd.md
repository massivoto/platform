# PRD: AI Provider Credential Resolution

**Status:** DRAFT
**Last updated:** 2026-03-24

> - DRAFT: Coding should not start, requirements being defined
> - APPROVED: Code can start, requirements stable
> - IMPLEMENTED: Tests passing, feature complete
> - ITERATING: Modifying existing code, PRD being updated

## Progress

| Section | Status | Progress |
|---------|--------|----------|
| Context | ✅ Complete | 100% |
| Scope | ✅ Complete | 100% |
| Requirements: Config Loading | ❌ Not Started | 0/4 |
| Requirements: Provider Resolution | ❌ Not Started | 0/3 |
| Requirements: Handler Declaration | ❌ Not Started | 0/3 |
| Requirements: Runtime Wiring | ❌ Not Started | 0/3 |
| Requirements: Integration Tests | ❌ Not Started | 0/4 |
| Acceptance Criteria | ❌ Not Started | 0/6 |
| Theme | ✅ Defined | - |
| **Overall** | **DRAFT** | **0%** |

## Parent PRD

- [auth-domain architecture](../../packages/auth-domain/auth-domain.archi.md)

## Child PRDs

- (none)

## Context

Every `@ai/*` handler in the interpreter (`TextHandler`, `GenerateImageHandler`, `ReverseImageHandler`) duplicates the same credential logic: a `getApiKey()` switch statement reading from `context.env` or `process.env`, a `createProvider()` switch statement instantiating `GeminiProvider`, and a `SUPPORTED_PROVIDERS` constant. This pattern will get worse with every new AI handler.

The goal is to centralize credential resolution in `@massivoto/auth-domain` so that:
1. A developer working in `workspace/f1/` configures `AI_PROVIDERS` and `<NAME>_API_KEY` in `.env`
2. At startup, the system validates the config and fails fast on missing keys
3. Each handler declares which providers it supports (`acceptedProviders`)
4. At execution time, the system resolves the best provider by intersecting handler capabilities with user priority
5. Handlers never touch credential logic again

This unblocks the entire v0.7 AI surface (The Race Was Great roadmap) and establishes the `workspace/.env` convention for all future providers.

### Source

- [ai-call-step1.brainstorm.md](./ai-call-step1.brainstorm.md)

### Current duplication (3 handlers, identical code)

All three handlers contain:
- `private providers: Map<string, AiProvider>` — instance cache
- `private getApiKey(providerName, context)` — switch on provider name
- `private createProvider(providerName, apiKey)` — switch returning `new GeminiProvider(apiKey)`
- `const SUPPORTED_PROVIDERS: AiProviderName[]` — static list
- `setProvider(name, provider)` — test hook

Files:
- `massivoto-interpreter/src/core-handlers/ai/text.handler.ts`
- `massivoto-interpreter/src/core-handlers/ai/image/generate.handler.ts`
- `massivoto-interpreter/src/core-handlers/ai/prompt/reverse-image.handler.ts`

## Decision Log

| Date | Option | Decision | Rationale |
|------|--------|----------|-----------|
| 2026-03-24 | Env var vs JSON config vs YAML | **Env var (`AI_PROVIDERS`)** | Simplest approach. Developer can quickly reorder/disable providers between runs by editing one line. No parsing complexity. |
| 2026-03-24 | Auto-detect from available keys vs mandatory `AI_PROVIDERS` | **Mandatory** | Developer must explicitly declare what's active. Enables quick enable/disable between runs without touching keys. |
| 2026-03-24 | Fail fast vs fail gracefully on missing keys | **Fail fast** | If you listed a provider in `AI_PROVIDERS`, you intend to use it. Missing key = config mistake, catch it early. |
| 2026-03-24 | Startup ping to validate keys vs no ping | **No ping** | Adds latency and network dependency. Invalid keys caught at first real API call, error is clear enough. |
| 2026-03-24 | Where credential logic lives | **auth-domain** | Single source of truth for credentials, reusable contract path from local to SaaS. |
| 2026-03-24 | Handler declares accepted providers | **In handler metadata** | Self-documenting — look at the handler, see what it supports. Change in one place when adding provider support. |
| 2026-03-24 | .env loading strategy | **dotenv priority chain** | Runtime walks up: `workspace/f1/.env` > `workspace/.env` > root `.env`. First file found wins entirely (no merging). Standard dotenv behavior, no custom tooling for production. |
| 2026-03-24 | Test env setup | **Copy utility for integration tests** | Integration tests need to control which keys are present. A test utility selectively copies keys from root `.env` to a temp test `.env`. Production code never copies — it just reads. |

## Scope

**In scope:**
- Loading `.env` via dotenv priority chain: `workspace/project/.env` > `workspace/.env` > root `.env` (first file wins, no merging)
- Reading `AI_PROVIDERS` and `<NAME>_API_KEY` from the loaded env
- Validating at startup: fail fast on missing/unknown providers
- Provider resolution: intersect handler's `acceptedProviders` with user priority
- `acceptedProviders` metadata on `BaseCommandHandler` or handler level
- Extracting `getApiKey()` and `createProvider()` from all 3 handlers into auth-domain
- GeminiProvider text generation verification (provider already exists)
- Integration test infrastructure: `yarn integration` command, isolated from `yarn test`

**Out of scope:**
- OAuth flows (SaaS mode)
- UI for managing providers
- Per-capability provider overrides ("use X for text, Y for images")
- Encryption / secure storage
- Token refresh / expiry (API keys don't expire)
- OpenAI/Anthropic provider implementations
- Image generation integration tests (slow, costs money)
- Provider instance caching refactoring (roadmap item)
- Langchain JS migration (roadmap item)

## Requirements

### Config Loading

**Last updated:** 2026-03-24
**Test:** `npx vitest run packages/auth-domain/src/ai-config`
**Progress:** 0/4 (0%)

- ❌ R-AIC-01: Parse `AI_PROVIDERS` env var as comma-separated list of provider names. Trim whitespace around each entry. Deduplicate silently.
- ❌ R-AIC-02: Validate each provider name against known providers (`gemini`, `openai`, `anthropic`). Fail fast with error: `Unknown provider 'X' in AI_PROVIDERS. Valid options: gemini, openai, anthropic`
- ❌ R-AIC-03: For each provider in `AI_PROVIDERS`, verify the corresponding `<NAME>_API_KEY` env var is set (non-empty). Fail fast with error: `Provider 'gemini' is listed in AI_PROVIDERS but GEMINI_API_KEY is not set. Add it to your .env file`
- ❌ R-AIC-04: If `AI_PROVIDERS` is missing or empty, fail fast with error: `AI_PROVIDERS is required. Set it in your .env file. Example: AI_PROVIDERS=gemini`

### Provider Resolution

**Last updated:** 2026-03-24
**Test:** `npx vitest run packages/auth-domain/src/ai-config`
**Progress:** 0/3 (0%)

- ❌ R-AIC-21: Given a command's `acceptedProviders` list and the loaded provider config, resolve the first provider from `AI_PROVIDERS` that appears in `acceptedProviders`. User priority wins.
- ❌ R-AIC-22: If no provider in `AI_PROVIDERS` matches the command's `acceptedProviders`, throw with error: `No compatible provider for this command. Command accepts: [gemini, openai]. Available providers: [anthropic]`
- ❌ R-AIC-23: Return both the resolved provider name and its API key, so the handler can instantiate the provider.

### Handler Declaration

**Last updated:** 2026-03-24
**Test:** `npx vitest run massivoto-interpreter/src/core-handlers/ai`
**Progress:** 0/3 (0%)

- ❌ R-AIC-41: Add `acceptedProviders: AiProviderName[]` property to `BaseCommandHandler` (or as a required field on AI handlers). Must be set at construction time.
- ❌ R-AIC-42: Update `TextHandler`, `GenerateImageHandler`, and `ReverseImageHandler` to declare their `acceptedProviders` (all currently support `['gemini']` with `openai` and `anthropic` as future).
- ❌ R-AIC-43: Remove duplicated `getApiKey()`, `createProvider()`, `SUPPORTED_PROVIDERS`, and `providers: Map` from all 3 handlers. Replace with call to the centralized resolution from auth-domain.

### Runtime Wiring

**Last updated:** 2026-03-24
**Test:** `npx vitest run massivoto-interpreter/src/core-handlers/ai`
**Progress:** 0/3 (0%)

- ❌ R-AIC-61: Load `.env` using a dotenv priority chain: `workspace/f1/.env` > `workspace/.env` > root `.env`. The first file found is loaded entirely — no merging across files. This populates `process.env` before config validation runs.
- ❌ R-AIC-62: Make the loaded config available to handlers through `ExecutionContext` or through dependency injection at handler construction. Handlers must not read env vars directly.
- ❌ R-AIC-63: Existing handler unit tests must continue to pass. The `setProvider()` test hook can remain as an alternative to the config-based resolution for unit testing.

### Integration Tests

**Last updated:** 2026-03-24
**Test:** `yarn integration`
**Progress:** 0/4 (0%)

- ❌ R-AIC-81: Create a `yarn integration` command that runs integration test files (e.g., `*.integration.spec.ts`) separately from `yarn test`. Standard `yarn test` must never make real API calls.
- ❌ R-AIC-82: Create a test utility function that selectively copies keys from the root `.env` into a temporary test `.env`. This allows integration tests to control exactly which providers and keys are available (e.g., "only gemini", "both gemini and openai", "missing key"). The utility cleans up the temp file after the test.
- ❌ R-AIC-83: Write an integration test that uses the copy utility to set up `AI_PROVIDERS=gemini` + `GEMINI_API_KEY`, loads config via the resolution layer, calls `generateText` with a short prompt, and verifies a non-empty text response with `tokensUsed > 0`.
- ❌ R-AIC-84: If root `.env` has no API keys or is missing, integration tests skip gracefully with message: `Skipping integration tests: no API keys found in root .env. See env.dist for setup.`

## Dependencies

- **Depends on:**
  - `@massivoto/kit` — `AiProvider`, `AiProviderName`, `ExecutionContext` contracts
  - `@massivoto/auth-domain` — target package for the new credential resolution code
  - `massivoto-interpreter` — `GeminiProvider` implementation, 3 handlers to refactor
- **Blocks:**
  - All future `@ai/*` handlers (will use the centralized resolution instead of duplicating)
  - v0.7 The Race Was Great roadmap items

## Open Questions

- [ ] Where exactly in auth-domain does this live? New `ai-config/` module, or extension of `providers.ts`?
- [ ] Should `acceptedProviders` live on `BaseCommandHandler` (all handlers) or only on AI handlers? If only AI handlers, what's the type boundary?
- [x] ~~How does `ExecutionContext.env` get populated from `workspace/.env`?~~ Resolved: dotenv priority chain at runtime startup. First file wins, no merging.

## Acceptance Criteria

### Theme

> **Theme:** Formula One Racing Workshop
>
> Marco is a developer building OTO automations for a Formula One content platform.
> He works in the `workspace/f1/` folder and needs AI commands to generate race commentary.
> New theme for this feature.

### Criteria

- [ ] AC-AIC-01: Given Marco has `AI_PROVIDERS=gemini` and `GEMINI_API_KEY=valid-key` in his `workspace/f1/.env`, when he runs `@ai/text prompt="Describe a wet Monaco start" output=commentary`, then `commentary` contains generated text about Monaco racing
- [ ] AC-AIC-02: Given Marco has `AI_PROVIDERS=gemini,openai` but only `GEMINI_API_KEY` is set (no `OPENAI_API_KEY`), when the runtime starts, then it fails immediately with: `Provider 'openai' is listed in AI_PROVIDERS but OPENAI_API_KEY is not set`
- [ ] AC-AIC-03: Given Marco has `AI_PROVIDERS=openai,gemini` and both keys set, when `@ai/text` runs (which accepts `[gemini, openai]`), then OpenAI is selected because it has higher user priority
- [ ] AC-AIC-04: Given Marco has no `.env` file or `AI_PROVIDERS` is missing, when the runtime starts, then it fails with a clear message telling him to set `AI_PROVIDERS` in his `.env`
- [ ] AC-AIC-05: Given Marco runs `yarn test`, then no real API calls are made. Given he runs `yarn integration` with valid `.env`, then real Gemini API calls execute and verify text generation works end-to-end
- [ ] AC-AIC-06: Given the `TextHandler` source code after refactoring, when Marco reads it, then there is no `getApiKey()`, no `createProvider()`, no `SUPPORTED_PROVIDERS` constant — credential logic lives entirely in auth-domain
- [ ] All automated tests pass
- [ ] Edge cases covered in separate `*.edge.spec.ts` files
