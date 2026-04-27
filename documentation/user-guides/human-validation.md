# Human Validation

Some workflows must pause for a human. OTO provides this through **applets** — tiny web apps that the runtime spawns mid-program, waits for a response from, then terminates.

## The two built-in applets

| Command | Applet | Use case |
|---------|--------|----------|
| `@human/confirm` | `confirm` | Approve or reject one item |
| `@human/grid` | `grid` | Pick zero or more items from a list |

A third (`generation`) is planned but not yet implemented.

## Confirm — yes or no

```oto
@human/confirm message="Send this email to the team?" output=approved
```

When this command runs, the runtime:

1. Picks a free local port (10000–20000).
2. Starts an Express server.
3. Serves the React UI on that port.
4. Logs the URL: `http://localhost:14582`.
5. **Blocks** until the user opens the URL and clicks Approve or Reject.
6. Tears down the server.
7. Stores the boolean response in `approved`.

You then continue:

```oto
@email/send to="team@co.com" if={approved}
```

### Confirm with a resource

`@human/confirm` can display an image, a video, or an embed alongside the text:

```oto
@human/confirm message="Approve this generated cover?" resourceUrl="./out/cover.png" output=approved
```

Supported resources: images (jpg/png/webp), videos (mp4), PDFs, and YouTube/Vimeo embeds (the URL is auto-detected).

### Confirm with a custom title

```oto
@human/confirm title="Marketing review" message="..." output=...
```

The title appears in the browser tab and as the page header.

## Grid — pick from many

```oto
@human/grid items=candidates title="Select images to publish" output=selected
```

`candidates` is an array of objects with at least a label or resource. The applet renders them in a grid with checkboxes. The user ticks any subset and submits. `selected` is the subset that was checked.

A typical generate-then-review pattern:

```oto
@ai/image/generate prompt="A racing car"  forEach=situations->situation collect=images
@human/grid items=images title="Pick the keepers" output=keepers
@file/save file={["selection/", $index, ".png"] | join} forEach=keepers->image
```

## Behind the scenes — the AppletLauncher

The runtime needs an **AppletLauncher** in its execution context to spawn applets. The default `LocalAppletLauncher`:

- Allocates ports randomly in 10000–20000.
- Builds the Express + React server inline.
- Serves the prebuilt frontend bundle from the applet package.
- Returns a Promise that resolves when the user submits.

If the runner is started without an `AppletLauncher`, `@human/*` commands fail with a clear error. The local CLI (`oto run`) wires one in automatically. A SaaS or Docker runner injects a different launcher (Cloud, ECS, etc.) — your `.oto` program does not change.

## Non-UI input

Each applet also accepts a programmatic response, useful for tests and CI:

```bash
# REST
curl -X POST http://localhost:14582/respond -d '{"approved": true}' -H 'Content-Type: application/json'

# Or via the future commander cli
massivoto respond --applet 14582 --data '{"approved":true}'
```

This means an applet can be unblocked by a script, not just a human.

## Timeouts

By default, applets wait up to **48 hours** for a response in v0.5 (local mode). If no one responds, the command fails. SaaS deployment will configure shorter, plan-based timeouts.

## Common patterns

### Approve before destructive action

```oto
@db/dryrun query=cleanupSql output=preview
@human/confirm message="Apply: {preview.affectedRows} rows" output=ok
@db/run query=cleanupSql if={ok}
```

### Curate AI output

```oto
@ai/text prompt="Suggest 10 product names" forEach=situations->s collect=names
@human/grid items=names title="Pick the keepers" output=finalNames
```

### Multi-step approval

```oto
@human/confirm message="Step 1: copy approved?" output=copyOk if={!copyOk}
@human/confirm message="Step 2: design approved?" output=designOk if={copyOk}
@deploy/launch if={copyOk && designOk}
```

## Pitfalls

**Forgetting that the program blocks.** Until the user clicks, your terminal hangs. Useful in interactive sessions, painful in CI. Use the non-UI input form (or skip the validation entirely) in unattended environments.

**Browser closes mid-validation.** Today the program waits for the timeout. The roadmap covers crash recovery and idle handling for v1.0.

**Passing a non-serializable item to `grid`.** Items must be JSON-serializable so they survive the round trip to the browser. A `FileReference` (from `~/path`) serializes fine; a function does not.

## References

- **Other guides:**
  - [iteration.md](./iteration.md) — generate-then-review patterns rely on `forEach` + `collect`
  - [security.md](./security.md) — what data not to send to a browser-rendered applet
- **Applet architecture:** [`../../packages/kit/src/applets/applet.archi.md`](../../packages/kit/src/applets/applet.archi.md) — `AppletDefinition`, `AppletLauncher`, lifecycle, local vs cloud implementations
- **Source code:**
  - `massivoto-interpreter/src/core-handlers/human/confirm.handler.ts` — confirm command
  - `massivoto-interpreter/src/core-handlers/human/grid.handler.ts` — grid command
  - `massivoto-platform/applets/confirm/` — full applet package (definition, server, React frontend)
  - `massivoto-platform/applets/grid/` — grid applet package
  - `massivoto-platform/packages/runtime/src/applets/local/` — `LocalAppletLauncher`, port allocator
- **Roadmap:** [`../../../ROADMAP.md`](../../../ROADMAP.md) — section "Applets: Human Validation Checkpoints" for the planned `generation` applet, cloud launcher, and crash recovery
