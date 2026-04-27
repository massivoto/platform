# AI Actions

OTO ships with built-in commands for calling AI providers — text generation, image generation, image-to-prompt reverse-engineering. This guide covers the basics: what each command does, how to provide credentials, and how to pick a provider.

## The three core AI commands

| Command | Purpose | Output |
|---------|---------|--------|
| `@ai/text` | Generate text from a prompt | String |
| `@ai/image/generate` | Generate an image from a prompt | Image (Buffer or base64) |
| `@ai/prompt/reverseImage` | Describe an image as a prompt | String |

## Text generation

```oto
@ai/text prompt="Write a haiku about parsers" output=poem
@utils/log message=poem
```

Common args:

| Arg | Type | Default | Meaning |
|-----|------|---------|---------|
| `prompt` | string | required | The user prompt |
| `system` | string | none | System message that frames the model |
| `model` | string | provider default | Specific model name (e.g. `gpt-4o-mini`, `claude-haiku-4-5`) |
| `temperature` | number | provider default | Sampling temperature |
| `maxTokens` | number | provider default | Cap on output length |

```oto
@ai/text
  system="You are a terse assistant."
  prompt="Summarize: {article.body}"
  temperature=0.3
  maxTokens=200
  output=summary
```

(The line wrapping is for readability — DSL 0.5 commands fit on one line. Wrap in your editor if you need to.)

## Image generation

```oto
@ai/image/generate prompt="A racing car at sunrise, vector art" output=image
@file/save data=image file=~/out/car.png
```

The output is a Buffer or base64 string, depending on the provider. `@file/save` accepts both.

Common args:

- `prompt`: required
- `model`: provider-specific model name
- `size`: e.g. `"1024x1024"`
- `style`: provider-specific style hint
- `variation`: alternative prompt variations

## Reverse-engineering an image

```oto
@ai/prompt/reverseImage image=~/photo.jpg output=stylePrompt
@ai/image/generate prompt={stylePrompt} output=newImage
```

Useful for "give me more like this": describe an existing image as a prompt, then re-generate variations.

`@ai/prompt/reverseImage` returns a description with a `{{variation}}` placeholder where appropriate, so you can splice in different subjects.

## Providers and credentials

OTO does not bundle a specific AI vendor. It uses [LangChain](https://js.langchain.com/) under the hood and routes to whichever provider has credentials in the environment. Today the supported providers are:

| Provider | Env var | What it powers |
|----------|---------|----------------|
| OpenAI | `OPENAI_API_KEY` | Text, images |
| Anthropic | `ANTHROPIC_API_KEY` | Text |
| Google (Gemini) | `GEMINI_API_KEY` | Text, images, embeddings |
| Mistral | `MISTRAL_API_KEY` | Text |

Set the keys once in your shell or a `.env` file at the project root:

```bash
# .env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
```

The CLI auto-loads `.env`. You can also export them in your shell. Your `.oto` program never sees the literal key.

## Provider auto-routing

When you run `@ai/text` without specifying `model`, the runtime picks a provider based on:

1. `model` arg (if you wrote one).
2. The first provider whose env var is present.
3. A fail with a clear "no provider available" error.

You can also pin a provider explicitly:

```oto
@ai/text prompt="..." model="gpt-4o-mini" output=summary
@ai/text prompt="..." model="claude-haiku-4-5" output=summary2
```

The model name implies the provider — `gpt-*` → OpenAI, `claude-*` → Anthropic, `gemini-*` → Google.

## Cost tracking

Every AI call accumulates a `cost` value in the execution context. You can read it later:

```oto
@ai/text prompt="..." output=result
@utils/log message="Used {cost.current} credits so far"
```

The `cost` is in abstract credits — the conversion to USD is provider-dependent and configured at runner startup.

## Retrying transient failures

AI APIs are flaky. Combine with `retry=`:

```oto
@ai/text prompt="..." retry=3 output=result
```

The runtime sleeps between retries with exponential backoff (built-in, not configurable in DSL 0.5).

## Generating in bulk

```oto
@ai/text prompt="Write a tagline for {product}" forEach=products->product retry=2 collect=taglines
```

Each iteration:

- Fresh AI call with the iterator value substituted.
- Retry budget applies per iteration.
- Result appended to `taglines`.

If one iteration permanently fails, the program halts. To collect-best-effort, wrap in `@block/begin` and use `if=` to recover.

## Streaming

Streaming output is **not** in DSL 0.5. The `$` sigil (`$index` etc.) is reserved for streams in a future version. For now, every AI call is a complete-then-return.

## Pitfalls

**Forgetting `output=`.** The result is computed, billed, and discarded.

**Sending secrets in prompts.** AI providers store some prompts for training and abuse detection (depending on their policy). Strip secrets first. See [security.md](./security.md).

**Wrong model name.** A typo silently routes to the default provider, which may fail or charge unexpectedly. Pin and check.

**Mixing providers within `forEach`.** Each iteration picks the same provider. To compare providers, run two separate `forEach` blocks with explicit `model=`.

## References

- **Other guides:**
  - [security.md](./security.md) — what not to put in a prompt
  - [iteration.md](./iteration.md) — bulk generation patterns
  - [files-and-globs.md](./files-and-globs.md) — saving generated images to disk
  - [human-validation.md](./human-validation.md) — human-in-the-loop review of AI output
- **AI providers documentation:** [`../ai/ai-providers.md`](../ai/ai-providers.md) — supported providers, env vars, model naming
- **Source code:**
  - `massivoto-interpreter/src/core-handlers/ai/text.handler.ts` — `@ai/text`
  - `massivoto-interpreter/src/core-handlers/ai/image/generate.handler.ts` — `@ai/image/generate`
  - `massivoto-interpreter/src/core-handlers/ai/prompt/reverse-image.handler.ts` — `@ai/prompt/reverseImage`
- **Done feature PRDs:**
  - [`features/_done/ai-config/ai-call-step1.done.prd.md`](../../../features/_done/ai-config/ai-call-step1.done.prd.md) — credential resolution
  - [`features/_done/handler-config/provider-autoroute.done.prd.md`](../../../features/_done/handler-config/provider-autoroute.done.prd.md) — auto-routing logic
  - [`features/_done/langchain/langchain.done.prd.md`](../../../features/_done/langchain/langchain.done.prd.md) — LangChain integration
  - [`features/_done/provider-caching/provider-caching.done.prd.md`](../../../features/_done/provider-caching/provider-caching.done.prd.md) — provider instance reuse
- **Roadmap:** [`../../../ROADMAP.md`](../../../ROADMAP.md) — section "@ai/ragify" for upcoming RAG support, "Streams" for future streaming
