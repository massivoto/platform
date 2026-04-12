# AI Providers Configuration

This document explains how Massivoto discovers, validates, and resolves AI provider credentials for OTO commands like `@ai/text`, `@ai/image/generate`, and `@ai/prompt/reverseImage`.

## Quick Start

Create a `.env` file at your project root:

```env
AI_PROVIDERS=gemini
GEMINI_API_KEY=AIzaSy...your-key-here
```

That's it. All `@ai/*` commands will use Gemini.

## Configuration Layers

Massivoto uses a 4-layer configuration model. Each layer overrides the previous.

```
Layer 0 (hardcoded)    defaults.ts             works with zero config
Layer 1 (.env)         API keys + AI_PROVIDERS  minimal user setup
Layer 2 (config file)  massivoto.config.json    optional, per-capability preferences
Layer 3 (OTO command)  provider= model= args    per-command overrides
```

Most users only need Layer 1 (a `.env` file).

---

## Layer 0: Hardcoded Defaults

If nothing is configured, Gemini is assumed as the default provider. Model defaults are defined in `massivoto-interpreter/src/core-handlers/ai/defaults.ts`:

| Setting | Default value |
|---------|--------------|
| Provider | `gemini` |
| Text model | `gemini-2.5-flash` |
| Image model | `imagen-3.0-generate-002` |

An API key is always required -- Layer 0 provides a provider name, not credentials.

## Layer 1: `.env` File

The `.env` file holds API keys and the provider priority list.

### Required variables

| Variable | Format | Example |
|----------|--------|---------|
| `AI_PROVIDERS` | Comma-separated provider names, in priority order | `gemini` or `openai,gemini` |
| `<NAME>_API_KEY` | API key for each listed provider | `GEMINI_API_KEY=AIzaSy...` |

### Known providers

These providers have built-in support with known API key variable names:

| Provider | Key variable | Status |
|----------|-------------|--------|
| `gemini` | `GEMINI_API_KEY` | Implemented |
| `openai` | `OPENAI_API_KEY` | Planned |
| `anthropic` | `ANTHROPIC_API_KEY` | Planned |

### Custom / unknown providers

The provider list is **not closed**. Users can configure any provider name. For unknown providers, the system derives the API key variable name from the provider name using the `<UPPER_NAME>_API_KEY` convention. For example, a provider named `mistral` expects `MISTRAL_API_KEY`.

Handlers never filter or reject providers. If the user configures a provider in `.env` or `massivoto.config.json`, the system trusts it. Errors surface naturally at runtime when the provider can't fulfill a request -- not at config time with a static allowlist.

This design supports Hugging Face models, local inference servers, custom APIs, and any future provider without code changes.

### Provider name normalization

Provider names are case-insensitive and separator-insensitive. All of these resolve to the same provider:

```
openai, openAi, OpenAI, open_ai, open-ai  -->  openai
```

CamelCase is the Massivoto convention, but any variant works.

### Loading chain

The system finds your `.env` using `loadEnvChain(projectDir, rootDir)` from `@massivoto/auth-domain`. It walks up from the project directory to the root, returning the **first** `.env` found. Files are not merged.

```
your-project/
  programs/
    workflow.oto      <-- running from here
  .env                <-- found here, used
../
  .env                <-- ignored (first match wins)
```

Source: `packages/auth-domain/src/ai-config/load-env.ts`

### Validation (fail-fast)

`loadAiConfig(env)` validates the loaded environment at startup:

- `AI_PROVIDERS` must exist and be non-empty
- Each listed provider must be a known name
- Each listed provider must have its corresponding `<NAME>_API_KEY` set
- Duplicates are silently removed

Errors are actionable:

```
AI_PROVIDERS is required. Set it in your .env file. Example: AI_PROVIDERS=gemini
```

```
Provider 'openai' is listed in AI_PROVIDERS but OPENAI_API_KEY is not set. Add it to your .env file
```

If no API keys are found at all, a startup message points to Gemini (free tier) to get started.

Source: `packages/auth-domain/src/ai-config/ai-config.ts`

## Layer 2: Config File (massivoto.config.json)

An optional JSON config file defines per-capability and per-handler provider preferences. If absent, Layer 1 behavior applies.

### Config file locations

Two locations are supported, with workspace overriding team defaults:

| Location | Purpose |
|----------|---------|
| `massivoto-platform/config/massivoto.config.json` | Team defaults (shared in repo) |
| `workspace/<project>/config/massivoto.config.json` | Per-workspace override |

### Format

```json
{
  "ai": {
    "text": {
      "provider": "openai",
      "model": "gpt-4o",
      "fallback": "gemini"
    },
    "image": {
      "provider": "gemini",
      "model": "imagen-3.0-generate-002"
    },
    "image-analysis": {
      "provider": "gemini",
      "model": "gemini-2.5-flash"
    },
    "handlers": {
      "@ai/prompt/reverseImage": {
        "provider": "anthropic",
        "model": "claude-sonnet-4-20250514"
      }
    }
  }
}
```

### Capability keys

Config is organized by capability, not by handler name. This decouples config from handler naming.

| Capability | Handlers | AiProvider method |
|------------|---------|-------------------|
| `text` | `@ai/text` | `generateText()` |
| `image` | `@ai/image/generate` | `generateImage()` |
| `image-analysis` | `@ai/prompt/reverseImage` | `analyzeImage()` |
| `embedding` | (future) | (future) |

### Per-handler overrides

The `handlers` section allows overriding the capability default for a specific handler. Handler-specific config wins over capability config.

### Fallback field

If the preferred provider for a capability is unavailable, the `fallback` provider is tried.

### Validation

At startup, the config is validated against the `.env`:
- If a config references a provider not in `AI_PROVIDERS` or without an API key, the system **fails fast** with a clear error guiding the user.

## Layer 3: Per-Command Overrides

Handlers accept `provider` and `model` as optional OTO args:

```oto
@ai/text provider="anthropic" model="claude-sonnet-4-20250514" prompt="..." output=result
@ai/prompt/reverseImage image={photo} model="light" output=prompt
```

Layer 3 always wins over config. It bypasses capability checks -- if the user explicitly picks a provider, the system attempts it and lets the provider error naturally if incompatible.

---

## Resolution Order

When an `@ai/*` command runs:

```
handler.run(args, context)
  |
  +-- args.provider set?                  --> use it (Layer 3)
  |
  +-- handlerConfig[@ai/handler] set?     --> use handler-specific config (Layer 2)
  |
  +-- handlerConfig[capability] set?      --> use capability config (Layer 2)
  |
  +-- resolveProvider(aiConfig, accepted)  --> first match from AI_PROVIDERS (Layer 1)
  |
  +-- DEFAULT_AI_PROVIDER ('gemini')      --> hardcoded fallback (Layer 0)
```

Each handler declares which providers it supports via `acceptedProviders`. `resolveProvider()` picks the **first** provider from your `AI_PROVIDERS` list that the handler accepts. Order matters.

## Multi-Provider Example

```env
AI_PROVIDERS=openai,gemini
OPENAI_API_KEY=sk-proj-...
GEMINI_API_KEY=AIzaSy...
```

With `massivoto.config.json`:
```json
{
  "ai": {
    "text": { "provider": "openai", "model": "gpt-4o" },
    "image": { "provider": "gemini" }
  }
}
```

Result:
- `@ai/text` uses OpenAI GPT-4o (config)
- `@ai/image/generate` uses Gemini Imagen (config)
- `@ai/prompt/reverseImage` uses OpenAI (first match in AI_PROVIDERS for image-analysis capability)
- `@ai/text provider="gemini"` uses Gemini (per-command override wins)

## Model Tiers

Each provider maps two tier aliases to concrete model IDs:

| Tier | Gemini model | Usage |
|------|-------------|-------|
| `best` | `gemini-2.5-flash` | Default. Best quality. |
| `light` | `gemini-2.5-flash` | Faster/cheaper (same model for now). |

Override with `model="light"` or a raw model ID:

```oto
@ai/prompt/reverseImage image={photo} model="light" output=prompt
@ai/text prompt="Hello" model="gemini-2.5-pro" output=reply
```

Defined in: `massivoto-interpreter/src/core-handlers/ai/defaults.ts`

## Architecture

```
.env file                            massivoto.config.json (optional)
  |                                    |
  v                                    v
loadEnvChain()                       loadHandlerConfig()
  |                                    |
  v                                    v
loadAiConfig(env)                    HandlerConfig
  |                                    |
  v                                    v
AiProviderConfig                     stored on context.handlerConfig
  |
  v
stored on context.aiConfig
  |
  +-----------------------------------+
  |                                   |
  v                                   v
resolveProvider(config, accepted)    resolveHandlerProvider(capability, config, aiConfig)
  |                                   |
  v                                   v
createAiProvider(name, apiKey)       selected provider + model
```

### Key types

```typescript
// Open type -- any string is valid. Known names are convenience constants, not constraints.
type AiProviderName = string

interface AiProviderEntry {
  name: string
  apiKey: string
}

interface AiProviderConfig {
  providers: AiProviderEntry[]  // ordered by user priority
}

interface CapabilityConfig {
  provider: string
  model?: string
  fallback?: string
}

interface HandlerConfig {
  ai?: {
    text?: CapabilityConfig
    image?: CapabilityConfig
    'image-analysis'?: CapabilityConfig
    embedding?: CapabilityConfig
    handlers?: Record<string, CapabilityConfig>
  }
}
```

### Where it lives

The split between kit and auth-domain is intentional:

- **`@massivoto/kit`** holds types, interfaces, and pure functions (no I/O, no dependencies). The interpreter depends on kit only in production.
- **`@massivoto/auth-domain`** holds config loading with side effects: reading `.env` files from disk (`dotenv`), parsing `massivoto.config.json`, validating against the filesystem. Only the platform and tests import auth-domain.
- **`massivoto-interpreter`** depends on kit, never on auth-domain in production. It receives resolved providers via `context.resolvedProvider` -- it doesn't know how config was loaded.

| Concern | Package | Why here |
|---------|---------|----------|
| Types (`AiProviderConfig`, `AiProviderName`, `ResolvedProvider`) | `@massivoto/kit` | Pure types, no I/O -- shared by all |
| Pure functions (`resolveProvider`, `deriveApiKeyName`) | `@massivoto/kit` | No side effects, needed by interpreter |
| .env loading (`loadEnvChain`) | `@massivoto/auth-domain` | Reads filesystem (`dotenv`) |
| AI config validation (`loadAiConfig`) | `@massivoto/auth-domain` | Parses env vars, validates keys |
| Config file loader (`loadHandlerConfig`) | `@massivoto/auth-domain` | Reads `massivoto.config.json` from disk |
| Provider name normalization | `@massivoto/auth-domain` | Platform-side utility |
| 4-layer resolution engine | `@massivoto/auth-domain` | Combines config sources (platform concern) |
| Runtime wiring (`buildAiContext`) | `@massivoto/runtime` | Startup glue: loads env + config, populates context |
| Provider implementations (`GeminiProvider`) | `massivoto-interpreter` | Execution engine, BSL licensed |
| `AiCommandHandler` + handler resolution | `massivoto-interpreter` | `instanceof` check before `handler.run()` |

## Integration Tests

For running integration tests with real API keys:

```bash
# Run integration tests (requires .env with GEMINI_API_KEY)
cd massivoto-interpreter
npm run integration
```

Tests are skipped automatically when API keys are not available.

See `massivoto-interpreter/src/core-handlers/ai/test-utils/integration-env.ts` for the test utility that loads keys from `.env`.
