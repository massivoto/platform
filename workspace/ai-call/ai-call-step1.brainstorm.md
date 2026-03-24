# AI Credential Management for Local Execution — Brainstorm

**Date:** 2026-03-24
**Participants:** Nicolas Zozol, Claude (facilitator)

---

## 1. Product Role

**What it IS:** A credential resolution layer in `auth-domain` that supplies API keys to `@ai/*` commands at runtime. It reads provider configuration from `workspace/.env`, validates it at startup, and resolves the best available provider for each command based on user-defined priority.

**What it is NOT:**
- Not a UI for managing providers
- Not an OAuth/SaaS credential vault
- Not a multi-tenant system
- Not encrypted storage

**Decision:** Infrastructure plumbing in `auth-domain`, designed local-first but with reusable contracts that support SaaS later.

**Rationale:** The auth-domain package becomes the single source of truth for "how do I get credentials for provider X" — regardless of whether we're reading an env var today or hitting an OAuth backend tomorrow. Putting it in auth-domain now avoids a future migration.

---

## 2. Target Audience

**Primary persona:** A developer working exclusively in `workspace/`, writing OTO programs and running them locally. They bring their own API keys in `workspace/.env`. They should never need to touch platform internals to get AI commands working.

**Decision:** Focus on this developer persona. DX matters: clear errors when config is wrong, obvious setup path via `env.dist`.

**Rationale:** This is the real user right now. The `workspace/` folder is their sandbox — `.env`, `.oto` files, custom actions, all in one place.

---

## 3. Core Problem

**Problem:** The `AiProvider` interface exists in `kit`, and `GeminiProvider` exists in the interpreter, but credential resolution is hardcoded inside each handler (`TextHandler.getApiKey()` with a switch statement). There's no centralized mechanism to:
- Declare which providers are active
- Define priority between them
- Match a command's supported providers against user config

**Consequences if we do nothing:**
- Every `@ai/*` command duplicates credential logic
- No consistency in key naming or error messages
- The entire v0.7 roadmap (The Race Was Great) is blocked
- Contributors can't experiment with AI features

**Decision:** Build a centralized credential resolution layer in auth-domain.

**Rationale:** The wiring between credentials and AI contracts is the missing piece. The `.env` file is the first concrete source, but the contract must support future sources.

---

## 4. Unique Value Proposition

**Options considered:**
- Option A: Each provider reads its own env var directly (quick hack) — inconsistent naming, duplicated logic, no path to SaaS
- Option B: Centralized resolution in auth-domain with priority-based matching — consistent, extensible, one contract

**Decision:** Option B. One consistent credential resolution mechanism.

**Rationale:** Avoids the consistency problem. Key design choices:
- `AI_PROVIDERS` env var is **mandatory** — defines active providers and priority order
- Keys follow `<NAME>_API_KEY` convention
- **Fail fast:** missing key for a listed provider = immediate error at startup
- No auto-detection, no magic — explicit developer control

The developer can quickly disable/reorder providers between runs by editing one env var. Commands declare their `acceptedProviders`, and the system intersects with user priority to find the best match.

---

## 5. Acquisition Strategy

**Decision:** Developer onboarding via `workspace/.env`.

The onboarding funnel:
1. Developer clones the repo
2. Goes to `workspace/`
3. Copies `env.dist` to `.env`
4. Sets `AI_PROVIDERS=gemini` and `GEMINI_API_KEY=...`
5. Runs their first OTO program with `@ai/text`
6. It works — or they get a clear, actionable error

**Rationale:** The critical moment is step 6. Error messages must be actionable (e.g., "Provider 'gemini' is listed in AI_PROVIDERS but GEMINI_API_KEY is not set. Add it to workspace/.env").

---

## 6. Functional Scope

**IN:**
- Reading `AI_PROVIDERS` and `<NAME>_API_KEY` from `.env`
- Validating at startup (fail fast on missing keys)
- Resolving the best available provider based on priority intersection
- `acceptedProviders` declaration on each `@ai/*` handler
- Wiring into the runtime so commands get a working `AiProvider`
- GeminiProvider text generation verification (already exists)
- Integration test infrastructure (`yarn integration`)

**OUT:**
- OAuth flows (SaaS mode)
- UI for managing providers
- Per-capability provider overrides ("use X for text, Y for images")
- Encryption / secure storage
- Token refresh / expiry
- OpenAI/Anthropic provider implementations
- Image generation testing (slow, costs money)

---

## 7. Core Features

### Feature: Provider Config Loading

**Capability:** Read `AI_PROVIDERS` and `<NAME>_API_KEY` from env, validate, fail fast.

**Acceptance Criteria:**
- Given a `.env` with `AI_PROVIDERS=gemini` and `GEMINI_API_KEY=AIxyz`, When the config loads, Then a provider config object is returned with gemini active
- Given `AI_PROVIDERS=gemini,openai` and only `GEMINI_API_KEY` set, When the config loads, Then it throws an error mentioning `OPENAI_API_KEY` is missing
- Given no `AI_PROVIDERS` env var, When the config loads, Then it throws an error saying `AI_PROVIDERS` is required

**Test Approach:** Unit tests with mocked env vars.

---

### Feature: Provider Resolution (Priority Intersection)

**Capability:** Given a command's accepted providers, resolve the best available provider by intersecting with user priority.

**Acceptance Criteria:**
- Given `AI_PROVIDERS=anthropic,gemini` and a command accepting `[gemini, openai]`, When resolving, Then gemini is selected
- Given `AI_PROVIDERS=openai,gemini` and a command accepting `[gemini, openai]`, When resolving, Then openai is selected (user priority wins)
- Given `AI_PROVIDERS=anthropic` and a command accepting `[gemini, openai]`, When resolving, Then it throws with a clear message listing the mismatch

**Test Approach:** Unit tests, pure logic.

---

### Feature: Command Handler Provider Declaration

**Capability:** Each `@ai/*` handler declares its `acceptedProviders` list.

**Acceptance Criteria:**
- Given a handler for `@ai/text`, When inspecting its metadata, Then `acceptedProviders` contains at least one provider name
- Given a new handler without `acceptedProviders`, When it's registered, Then a type error prevents compilation

**Test Approach:** Unit tests + TypeScript compiler enforcement.

---

### Feature: GeminiProvider Text Verification

**Capability:** Verify the existing GeminiProvider works end-to-end with text generation.

**Acceptance Criteria:**
- Given a valid Gemini API key, When calling `generateText` with a simple prompt, Then a text response is returned with `tokensUsed > 0`
- Given an invalid API key, When calling `generateText`, Then it throws with a clear auth error

**Test Approach:** Integration tests via `yarn integration`. Unit tests with mocked HTTP for error paths.

---

### Feature: Runtime Wiring

**Capability:** Extract hardcoded credential logic from handlers, centralize in auth-domain. Connect provider resolution to `@ai/text` command execution.

**Acceptance Criteria:**
- Given a configured `.env` and an OTO program with `@ai/text prompt="hello" output=result`, When the program runs, Then `result` contains generated text
- Given no `.env` configuration, When the runtime starts, Then it fails fast with an actionable error before any command executes

**Test Approach:** Integration test via `yarn integration`. Unit tests with mocked provider for wiring logic.

---

### Feature: Integration Test Infrastructure

**Capability:** Separate test command (`yarn integration`) that runs real API tests, isolated from `yarn test`.

**Acceptance Criteria:**
- Given `yarn test`, When tests execute, Then no API calls are made
- Given `yarn integration` with valid `.env`, When tests execute, Then real API calls run
- Given `yarn integration` without `.env`, When tests skip, Then a clear message explains why

**Test Approach:** Verify suite isolation.

---

## 8. Differentiating Features

### Feature: Provider Resolution with Priority Intersection

**Capability:** The system matches command capabilities against user preferences. A command declares what it supports, the user declares what's available and preferred, and the system finds the best match.

**Why it matters:** When you add OpenAI support to `@ai/text`, you change one array in the handler. When a user wants to switch providers, they reorder one env var. No code changes needed.

**Key values:** Simplicity to configure, fail fast, clear error messages when failing.

**Acceptance Criteria:**
- Given a command accepting `[gemini, openai]` and `AI_PROVIDERS=openai,gemini`, When resolved, Then openai is selected (user preference wins)
- Given `AI_PROVIDERS=gemini,openai` changed to `AI_PROVIDERS=openai,gemini` between runs, When the next run starts, Then openai is used without any code change

**Test Approach:** Unit tests, pure logic.

---

## 9. Version Assignment

**Decision:** Single delivery. All 6 features ship together.

**Rationale:** The scope is small enough that splitting into phases would create more overhead than value. Each feature depends on the others to be useful — config loading without wiring is dead code, wiring without integration tests is unverified.

---

## 10. Critical Edge Cases

| Edge Case | Behavior | Rationale |
|-----------|----------|-----------|
| Typo in `AI_PROVIDERS` (`gemni`) | Fail fast: "unknown provider 'gemni', valid: gemini, openai, anthropic" | Catch config mistakes early |
| Whitespace (`gemini, openai`) | Trim silently | Don't punish sloppy formatting |
| Duplicates (`gemini,gemini`) | Deduplicate silently | Harmless, not worth an error |
| Empty value (`AI_PROVIDERS=`) | Fail fast, same as missing | Empty is not a valid config |
| Key set but wrong value | Caught at first API call, not at startup | No startup ping — adds latency and network dependency |
| No compatible provider for command | Clear error at execution time | Can't know at startup which commands will run |

---

## 11. Non-Functional Constraints

- **Security:** Never log actual key values in error messages. Keys stay in `.env` (gitignored).
- **Performance:** Config loading is once at startup, negligible. No startup ping.
- **Integration tests:** Text-only to keep them fast. Image generation is slow and costs money — deferred.
- **Compliance:** None for local mode.

---

## 12. External Dependencies

- **Current:** Gemini REST API (`generativelanguage.googleapis.com/v1beta`) via raw `fetch`. No SDK.
- **Future (roadmap item):** Langchain JS as AI abstraction layer, behind an adapter pattern so Massivoto isn't locked in.

---

## 13. Major Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Refactoring breaks existing handlers | Low | Existing unit tests cover regressions |
| Scope creep into provider caching | Low | Discipline — caching smell noted for roadmap |
| API key in URL (Gemini query string) | Low (local only) | Langchain would handle this; deferred to security hardening |

---

## 14. Priority

**Decision:** Highest priority right now.

**Rationale:**
- Unblocks the entire v0.7 AI surface (The Race Was Great)
- Prevents credential logic duplication from getting worse with each new handler
- Establishes the `workspace/.env` convention early for all future providers
- More urgent than crawler (independent), grid applet (needs AI content), or licensing (legal, not technical)

---

## Gaps / Open Questions

1. **Where exactly in auth-domain does this live?** New module? Extension of existing `providers.ts`/`storage.ts`? To be decided during PRD.
2. **How does `ExecutionContext.env` get populated from `workspace/.env`?** The runner must load the `.env` — is this already wired?
3. **Provider factory pattern:** Who instantiates `GeminiProvider` — auth-domain (knows credentials) or interpreter (knows the implementation)? Likely interpreter, with auth-domain providing the key.

---

## Roadmap Items Identified

- [ ] **Langchain JS integration:** Introduce Langchain JS as AI abstraction layer behind an adapter pattern. Replace raw `fetch` calls in providers. Constraint: Massivoto must not be coupled to Langchain — swap must be possible.
- [ ] **Provider instance caching cleanup:** `TextHandler` holds a `providers: Map` that caches provider instances on the handler. This is a smell — provider lifecycle should be managed centrally, not per-handler.

---

## Next Steps

1. Write a PRD from this brainstorm (`ai-call-step1.wip.prd.md`)
2. Implement as single delivery: config loading, resolution, handler declarations, wiring, integration tests
3. Add the two new roadmap items (Langchain, provider caching)
