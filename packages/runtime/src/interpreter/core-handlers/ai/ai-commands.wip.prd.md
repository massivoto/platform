# PRD: AI Commands

**Status:** DONE
**Last updated:** 2026-01-26
**Target Version:** 0.5
**Location:** `packages/runtime/src/interpreter/core-handlers/ai/`

## Progress

| Section | Status | Progress |
|---------|--------|----------|
| Handler Infrastructure | DONE | 4/4 |
| @ai/text Handler | DONE | 5/5 |
| @ai/image Handler | DONE | 5/5 |
| Provider Integration | DONE | 4/4 |
| Testing | DONE | 4/4 |
| **Overall** | **DONE** | **100%** |

## Parent PRD

- None (standalone feature)

## Child PRDs

- None

## Context

AI generation is a core use case for Massivoto. Users need to generate text and images within their automation workflows. This PRD defines two commands:

- `@ai/text` - Text generation (LLM completion)
- `@ai/image` - Image generation (Imagen, DALL-E)

Both commands follow the same pattern: provider-agnostic interface with sensible defaults (Gemini).

## Decision Log

| Date | Option | Decision | Rationale |
|------|--------|----------|-----------|
| 2026-01-26 | Command naming | **`@ai/text` + `@ai/image`** | Clear intent, symmetric naming. Better than `@ai/generate type="..."`. |
| 2026-01-26 | Provider handling | **Argument with default** | `provider="gemini"` default. Easy to swap providers without changing command. |
| 2026-01-26 | Image output format | **Base64** | Simpler for v0.5. No external storage needed. URL option deferred to v1.0. |
| 2026-01-26 | API key storage | **Env var + env.dist** | `GEMINI_API_KEY` from env for v0.5. CredentialVault deferred to v1.0. |

## Scope

**In scope:**
- `@ai/text` command handler with Gemini support
- `@ai/image` command handler with Gemini (Imagen) support
- Provider abstraction for future OpenAI/Anthropic support
- Unit tests with mocked providers
- `env.dist` file documenting required environment variables

**Out of scope:**
- CredentialVault integration (v1.0)
- OpenAI provider implementation (v1.0)
- Anthropic provider implementation (v1.0)
- Streaming responses
- Chat/conversation mode (multi-turn)
- Image editing/variation
- Voice/audio generation

## Requirements

### Handler Infrastructure

**Last updated:** 2026-01-26
**Test:** `npx vitest run packages/runtime/src/interpreter/core-handlers/ai/`
**Progress:** 4/4 (100%)

- [x] R-AI-01: Create `ai/` directory in core-handlers with index barrel export
- [x] R-AI-02: Define `AiProvider` interface for text and image generation
- [x] R-AI-03: Register `@ai/text` and `@ai/image` handlers in CoreHandlersBundle
- [x] R-AI-04: Create `env.dist` at repo root with `GEMINI_API_KEY=your_key_here`

### @ai/text Handler

**Last updated:** 2026-01-26
**Test:** `npx vitest run packages/runtime/src/interpreter/core-handlers/ai/text.handler.spec.ts`
**Progress:** 5/5 (100%)

- [x] R-AI-10: Implement `text.handler.ts` accepting required args: `prompt`, `output`
- [x] R-AI-11: Support optional args: `provider` (default: `"gemini"`), `model`, `temperature`, `maxTokens`, `system`
- [x] R-AI-12: Resolve `{expressions}` in prompt before sending to provider
- [x] R-AI-13: Store generated text in `output` variable via ExecutionContext
- [x] R-AI-14: Return cost metadata (tokens used) in instruction result

**Command Signature:**

```oto
@ai/text prompt="Write a tagline for {product}" output=tagline
@ai/text provider="gemini" model="gemini-pro" prompt="Summarize {doc}" temperature=0.5 output=summary
```

| Arg | Required | Default | Type | Description |
|-----|----------|---------|------|-------------|
| `prompt` | Yes | - | string | Text prompt, supports `{expressions}` |
| `output` | Yes | - | identifier | Variable to store result |
| `provider` | No | `"gemini"` | string | `"gemini"`, `"openai"`, `"anthropic"` |
| `model` | No | provider default | string | Model variant (e.g., `"gemini-pro"`, `"gemini-flash"`) |
| `temperature` | No | `0.7` | number | Creativity 0.0-1.0 |
| `maxTokens` | No | - | number | Limit response length |
| `system` | No | - | string | System prompt for context |

### @ai/image Handler

**Last updated:** 2026-01-26
**Test:** `npx vitest run packages/runtime/src/interpreter/core-handlers/ai/image.handler.spec.ts`
**Progress:** 5/5 (100%)

- [x] R-AI-20: Implement `image.handler.ts` accepting required args: `prompt`, `output`
- [x] R-AI-21: Support optional args: `provider` (default: `"gemini"`), `size`, `style`
- [x] R-AI-22: Resolve `{expressions}` in prompt before sending to provider
- [x] R-AI-23: Store generated image as base64 string in `output` variable
- [x] R-AI-24: Return cost metadata (generation cost) in instruction result

**Command Signature:**

```oto
@ai/image prompt="A fox in a forest" output=foxImage
@ai/image provider="gemini" prompt="Logo for {brand}" size="square" style="illustration" output=logo
```

| Arg | Required | Default | Type | Description |
|-----|----------|---------|------|-------------|
| `prompt` | Yes | - | string | Image description, supports `{expressions}` |
| `output` | Yes | - | identifier | Variable to store base64 result |
| `provider` | No | `"gemini"` | string | `"gemini"` (Imagen), `"openai"` (DALL-E) |
| `size` | No | `"square"` | string | `"square"`, `"landscape"`, `"portrait"` |
| `style` | No | - | string | `"photo"`, `"illustration"`, `"3d"` |

### Provider Integration

**Last updated:** 2026-01-26
**Test:** `npx vitest run packages/runtime/src/interpreter/core-handlers/ai/providers/`
**Progress:** 4/4 (100%)

- [x] R-AI-30: Define `AiProvider` interface with `generateText()` and `generateImage()` methods
- [x] R-AI-31: Implement `GeminiProvider` for text generation via Gemini API
- [x] R-AI-32: Implement `GeminiProvider` for image generation via Imagen API
- [x] R-AI-33: Read API key from `process.env.GEMINI_API_KEY` (error if missing)

**AiProvider Interface:**

```typescript
interface AiProvider {
  generateText(request: TextRequest): Promise<TextResult>
  generateImage(request: ImageRequest): Promise<ImageResult>
}

interface TextRequest {
  prompt: string
  model?: string
  temperature?: number
  maxTokens?: number
  system?: string
}

interface TextResult {
  text: string
  tokensUsed: number
}

interface ImageRequest {
  prompt: string
  size?: 'square' | 'landscape' | 'portrait'
  style?: 'photo' | 'illustration' | '3d'
}

interface ImageResult {
  base64: string
  costUnits: number
}
```

### Testing

**Last updated:** 2026-01-26
**Test:** `npx vitest run packages/runtime/src/interpreter/core-handlers/ai/`
**Progress:** 4/4 (100%)

- [x] R-AI-40: Unit test `@ai/text` with mocked GeminiProvider
- [x] R-AI-41: Unit test `@ai/image` with mocked GeminiProvider
- [x] R-AI-42: Test expression resolution in prompts (`{variable}` expansion)
- [x] R-AI-43: Test error handling for missing API key, rate limits, invalid provider

## Acceptance Criteria

- [x] AC-01: `@ai/text prompt="Hello" output=greeting` stores generated text in `greeting` variable
- [x] AC-02: `@ai/image prompt="A cat" output=catPic` stores base64 image in `catPic` variable
- [x] AC-03: Expression `{name}` in prompt is resolved before API call
- [x] AC-04: Missing `prompt` or `output` argument returns clear error
- [x] AC-05: Unknown provider returns clear error listing valid options
- [x] AC-06: Missing `GEMINI_API_KEY` env var returns actionable error with setup instructions

## Environment Variables

**File:** `env.dist` (repo root)

```bash
# AI Provider API Keys
GEMINI_API_KEY=your_gemini_api_key_here

# Future providers (v1.0)
# OPENAI_API_KEY=your_openai_api_key_here
# ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Users copy `env.dist` to `.env` and fill in their keys. The `.env` file is gitignored.

## Example Usage

```oto
# Simple text generation
@utils/set input="Massivoto" output=product
@ai/text prompt="Write a tagline for {product}" output=tagline
@utils/log message={tagline}

# Image generation with options
@ai/image prompt="Futuristic city at sunset" size="landscape" style="illustration" output=cityImage

# Using generated image in confirm applet
@ai/image prompt="Logo concept for {brand}" output=logo
@human/confirm message="Do you approve this logo?" resourceUrl={"data:image/png;base64," + logo} output=approved
```

## Dependencies

- **Evaluator**: Required for `{expression}` resolution in prompts (exists)
- **CredentialVault**: Deferred to v1.0, using env vars for now

## Open Questions

1. **Rate limiting**: Should we implement client-side rate limiting or rely on provider errors?
2. **Caching**: Cache identical prompts to reduce costs? (Probably v1.0)
3. **Retry logic**: Auto-retry on transient failures? How many times?
