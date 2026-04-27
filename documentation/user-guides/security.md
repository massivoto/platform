# Security

This guide covers the things a beginner should know before running an OTO program with real credentials, real data, or against a real server.

## The threat model in one paragraph

An OTO program is plain text that anyone can read. It runs on your machine, calls external APIs, may write files, and may pause for human input on a local web server. The values it handles include API keys, tokens, prompts, generated content, and crawled data. Anything you put in the file is **as visible as a script** — there is no "secret" string in source. Anything the program *fetches* (env vars, vault entries, OAuth tokens) lives in memory and may be logged unless you actively prevent it.

## Where secrets go

### Do not write secrets into `.oto` files

```oto
@ai/text prompt="Summarize this" apiKey="sk-abc123..."   // ❌ never
```

Anyone reading the file (a teammate, git history, a leaked backup) can copy the key. Even more dangerous: when you share the file to ask for help (Claude, ChatGPT, Slack), the key goes with it.

### Read from environment variables

OTO exposes the process environment as a read-only namespace `env.`:

```oto
@ai/text prompt="Summarize" if={env.OPENAI_API_KEY} output=summary
```

The handler picks up the key automatically when configured to use the OpenAI provider. You set the key once in your shell or in a `.env` file:

```bash
# .env
OPENAI_API_KEY=sk-abc123...
GEMINI_API_KEY=...
```

The CLI loads `.env` by convention via `dotenv`. The program never sees the literal key — it only sees `env.OPENAI_API_KEY`, and the AI provider library reads the value internally.

### Use the auth-backend for OAuth providers

For services that require OAuth (Gmail, GitHub, Google Sheets), do not paste tokens into a `.oto` file or `.env`. Use the Massivoto auth-backend:

1. Run `apps/auth` (frontend) and `services/auth-backend` (backend).
2. Click "Connect" on the provider in the UI.
3. The backend stores the tokens server-side.
4. Your OTO program references the provider by name — the runtime fetches the token at run time.

This is still a v1.0 work-in-progress (see ROADMAP "ProviderRegistry" and "CredentialVault"). For v0.5 local development, stick to `env.*` for API-key style providers.

## What goes into logs

The runtime logs every command in `context.meta.history` as an `InstructionLog`. By default, this includes:

- The command name (`@ai/text`)
- Success / failure
- Duration and cost
- The output variable name
- The stored value (for debugging) — **this can leak sensitive content**

If your program does:

```oto
@ai/text prompt={env.SECRET_PROMPT} output=summary
```

…the **value** of `summary` ends up in `context.meta.history[*].value`. If the runner serializes `context` to disk (`oto run --save out.json`), the secret can leak into a JSON file.

Mitigations:

- Avoid `--save` for sensitive runs, or post-process the file to strip values.
- Wrap secret-containing steps in commands that opt out of logging the value (planned).
- Treat `meta.history` as a debug artifact, not a release artifact.

## What goes to the browser

Human-validation applets (`@human/confirm`, `@human/grid`) send the items they display to a local web server, which serves them to your browser:

- The applet runs on `localhost`. By default it is **not** exposed to the network.
- Items are JSON-serialized and sent over HTTP, in clear (no TLS on local).
- Anyone with access to your machine, your localhost ports, or your browser history can see what was rendered.

Practical advice:

- Do not pass raw API responses containing secrets to `@human/grid`.
- Strip credentials from items before review:

```oto
@utils/set input={accounts | map:displayName} output=safeNames
@human/grid items=safeNames output=keepers
```

## What goes to AI providers

Any prompt sent to `@ai/text`, `@ai/image/generate`, etc. **leaves your machine**. It goes to the provider (OpenAI, Anthropic, Google, etc.) and is subject to that provider's data-retention policy. If your prompt contains:

- Customer PII
- Proprietary code
- Trade secrets
- Anything covered by a data-processing agreement

…you are responsible for ensuring the provider is approved for that data. Some providers offer "no-training" tiers, others do not. Check before sending.

The `@ai/prompt/reverseImage` and `@ai/example` (in `@crawl/example`) commands also send images and HTML to AI providers — the same rule applies.

## What goes to web targets

`@web/fetch`, `@crawl/page`, `@crawl/follow`, etc. make outbound HTTP calls. The default User-Agent is the runtime's. Things to remember:

- **Rate limits.** Crawling without `maxRequestsPerMinute` can get your IP banned. Use `@crawl/session/open url=... maxRequestsPerMinute=30`.
- **robots.txt.** The current `SimpleCrawlAdapter` ignores it. Respect it manually.
- **Authenticated targets.** Sending an OAuth token to a host you do not control is dangerous. Use OAuth-based handlers that scope the token.

## Scripts running scripts

The runtime executes whatever the parser produces. There is no `eval` of arbitrary JavaScript. **Custom handlers** are JavaScript modules — installing a third-party handler package is equivalent to running its code with full access to the process. Only install trusted handler packages.

The roadmap calls out the [n8n RCE problem](https://hetmehta.com/posts/n8n-type-confusion-rce) explicitly: do not allow scripted handlers in production runners. v1.0 will sandbox custom code; v0.5 trusts what is installed.

## File-system access

`~/path` literals and `@file/save` are restricted to a `projectRoot` directory (set by the runner — defaults to `process.cwd()`). The evaluator rejects paths that escape it. This stops the simple cases of accidentally writing to `/etc/passwd`, but does not protect against:

- Symlinks inside the project that point outside.
- A handler that bypasses the file evaluator.

If you are running untrusted `.oto` programs, run them in a Docker container with a read-only project mount.

## Checklist for "is this safe to commit?"

Before pushing a `.oto` file:

- [ ] No literal API keys, tokens, passwords, or URLs with embedded credentials.
- [ ] No customer PII in prompts.
- [ ] All secrets referenced via `env.*` or a provider-resolution mechanism.
- [ ] Generated outputs (`--save`) are gitignored or scrubbed.
- [ ] If you collaborated with an AI on the file, double-check it did not paste real values from your context.

## References

- **Other guides:**
  - [variables-and-expressions.md](./variables-and-expressions.md) — `env.` namespace details
  - [human-validation.md](./human-validation.md) — what data crosses the localhost boundary
- **Architecture:**
  - [`../../packages/auth-domain/auth-domain.archi.md`](../../packages/auth-domain/auth-domain.archi.md) — OAuth and PKCE design
  - [`../../services/auth-backend/auth-backend.archi.md`](../../services/auth-backend/auth-backend.archi.md) — token storage, mock mode
- **Source code:**
  - `massivoto-interpreter/src/evaluator/evaluators.ts` — env namespace handling
  - `massivoto-platform/packages/runtime/src/runner/file-runner.ts` — `projectRoot` enforcement for file paths
- **Roadmap:** [`../../../ROADMAP.md`](../../../ROADMAP.md) — "CredentialVault and ProviderRegistry", "Production Hardening", "Security"
- **Done feature PRDs:**
  - [`features/_done/handler-config/handler-config.done.prd.md`](../../../features/_done/handler-config/handler-config.done.prd.md) — how handlers declare required providers
  - [`features/_done/handler-config/provider-autoroute.done.prd.md`](../../../features/_done/handler-config/provider-autoroute.done.prd.md) — automatic provider selection from `env.*`
- **External:** [n8n type-confusion RCE post-mortem](https://hetmehta.com/posts/n8n-type-confusion-rce) — referenced in roadmap as the failure mode v1.0 must avoid
