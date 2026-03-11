# @crawl — Web Crawling Commands

The `@crawl` bundle provides 6 commands for fetching, navigating, and extracting data from websites. Crawl output flows directly into OTO primitives (`@file/save`, `collect=`, `@ai/generate`, `@human/validation`) — no export/import step.

## Quick Reference

| Command | Purpose | Session required? |
|---------|---------|-------------------|
| `@crawl/fetch` | One-shot fetch + extract | No |
| `@crawl/session/open` | Create a crawl session | No |
| `@crawl/example` | Teach AI to find selectors | Yes |
| `@crawl/page` | Fetch next page from queue | Yes |
| `@crawl/extract` | Extract data from a page | No (optional) |
| `@crawl/follow` | Add links from a page to the queue | Yes |

## Core Concepts

### Two modes of operation

**One-shot** — A single `@crawl/fetch` call fetches one URL and returns content. No session, no loop.

**Session-based** — Open a session, optionally teach it with examples, then loop through pages. The session holds a URL queue, visited set, learned selectors, and a page counter with a configurable limit.

### Output format (`as=`)

All extraction commands accept an `as=` argument controlling the output format:

| Value | Output | Default for |
|-------|--------|-------------|
| `markdown` | HTML converted to markdown via turndown | `@crawl/fetch` (no selector) |
| `text` | Plain text, all tags stripped | `@crawl/extract`, `@crawl/fetch` (with selector) |
| `html` | Raw innerHTML | — |
| `images` | Array of absolute `src` URLs from `<img>` elements | — |
| `links` | Array of absolute `href` URLs from `<a>` elements | — |

### Selector resolution

Commands that accept selectors (`follow=`, `selector=`) resolve them in this order:

1. **CSS selector** — if the string contains `.`, `#`, `>`, `[`, or starts with a tag name, it is used as CSS directly
2. **Text match** — plain text like `"Read More"` matches `<a>` elements whose text content contains that string (case-insensitive)
3. **Learned selectors** — if no explicit selector is provided and a session has learned selectors (from `@crawl/example`), those are used as defaults

---

## Commands

### @crawl/fetch

One-shot fetch. No session needed.

```
@crawl/fetch url=<url> [selector=<css>] [as=<format>] output=<var>
```

| Arg | Required | Default | Description |
|-----|----------|---------|-------------|
| `url` | Yes | — | URL to fetch |
| `selector` | No | — | CSS selector to extract specific elements |
| `as` | No | `markdown` (no selector) / `text` (with selector) | Output format |
| `output` | Yes | — | Variable to store the result |

**Without selector** — returns the full page content formatted according to `as`.

**With selector** — applies the CSS selector to the page DOM. Single match returns a value, multiple matches return an array.

```oto
// Fetch full page as markdown
@crawl/fetch url="https://example.com/pricing" output=page

// Extract all links matching a pattern
@crawl/fetch url="https://blog.example.com" selector="a[href*='/post/']" as="links" output=articleUrls

// Extract text from specific elements
@crawl/fetch url="https://blog.example.com" selector="h2.title" as="text" output=titles
```

---

### @crawl/session/open

Creates a crawl session. The starting URL is added to the queue.

```
@crawl/session/open url=<url> [limit=100] [maxRequestsPerMinute=30] output=<var>
```

| Arg | Required | Default | Description |
|-----|----------|---------|-------------|
| `url` | Yes | — | Starting URL (must be `http://` or `https://`) |
| `limit` | No | `100` | Maximum number of pages to fetch |
| `maxRequestsPerMinute` | No | `30` | Rate limiting |
| `output` | Yes | — | Variable to store the session |

The session object exposes:

| Property | Type | Description |
|----------|------|-------------|
| `session.hasNext` | boolean | `true` while queue has URLs and `pageCount < limit` |
| `session.pageCount` | number | Number of pages fetched so far |

```oto
@crawl/session/open url="https://forum.example.com/topics" limit=50 maxRequestsPerMinute=10 output=session
```

---

### @crawl/example

Teaches the session which CSS selectors to use for extraction and navigation. Calls AI once per example page. Subsequent commands (`@crawl/extract`, `@crawl/follow`) use these learned selectors automatically.

```
@crawl/example url=<url> session=<session> [prompt=<text>]
```

| Arg | Required | Default | Description |
|-----|----------|---------|-------------|
| `url` | Yes | — | Example page URL |
| `session` | Yes | — | Session to teach |
| `prompt` | First call: Yes. Later: No | Inherited from first call | Instructions for AI: what to extract, what links to follow |

**Prompt inheritance:** the first `@crawl/example` call must include a `prompt=`. Subsequent calls inherit it. Providing `prompt=` again augments the base prompt (appended with a newline).

**AI-once principle:** the AI runs once per `@crawl/example` call to produce CSS selectors. The crawl loop itself is deterministic — no AI calls during `@crawl/page`/`@crawl/extract`/`@crawl/follow`.

```oto
// First example: set the prompt
@crawl/example url="https://forum.example.com/topic/42" prompt="Extract album title, artist, price. Follow pagination links." session=session

// Second example: refines selectors using both pages + inherited prompt
@crawl/example url="https://forum.example.com/topic/99" session=session
```

After teaching, `session.learnedSelectors` contains:
- `follow`: array of CSS selectors for navigation links
- `extract`: array of `{ field, selector, as }` — the AI infers the `as` type from the prompt (e.g. "album cover image" produces `as: "images"`)

---

### @crawl/page

Fetches the next URL from the session queue. Increments `session.pageCount`. When `pageCount` reaches the limit, `session.hasNext` becomes `false`.

```
@crawl/page session=<session> output=<var>
```

| Arg | Required | Default | Description |
|-----|----------|---------|-------------|
| `session` | Yes | — | Active crawl session |
| `output` | Yes | — | Variable to store the fetched page |

The page object exposes:

| Property | Type | Description |
|----------|------|-------------|
| `page.url` | string | The URL that was fetched |
| `page.status` | number | HTTP status code (200, 404, etc.) |

```oto
@crawl/page session=session output=page
```

If the queue is empty, the command fails with `"No more pages in queue"`. This should not happen when using `while={session.hasNext}`.

If the fetch returns an HTTP error (4xx, 5xx), the command still succeeds — the page is returned with the error status. Use `if=` to check `page.status` if needed.

---

### @crawl/extract

Extracts data from a fetched page using CSS selectors.

```
@crawl/extract input=<page> [session=<session>] [selector=<css>] [as=<format>] output=<var>
```

| Arg | Required | Default | Description |
|-----|----------|---------|-------------|
| `input` | Yes | — | A page from `@crawl/page` or `@crawl/fetch` |
| `session` | No | — | Session with learned selectors |
| `selector` | No | — | CSS selector (overrides learned selectors) |
| `as` | No | `text` | Output format (overrides learned `as` for all fields) |
| `output` | Yes | — | Variable to store extracted data |

**With explicit `selector=`** — extracts matching elements. Single match returns a value, multiple matches return an array.

**With learned selectors (from `@crawl/example`)** — extracts all fields as a structured object. Each field uses its own `as` type unless overridden by the `as=` arg.

**No selector and no learned selectors** — fails with `"No extract selector. Provide selector= arg or use @crawl/example first."`.

If a selector matches nothing on a page, the field is set to `null` (not an error).

```oto
// Manual selector
@crawl/extract input=page selector="h2.album-title" output=title
@crawl/extract input=page selector="img.cover" as="images" output=covers

// Learned selectors from @crawl/example
@crawl/extract session=session input=page output=record
// record = { title: "Wish You Were Here", artist: "Pink Floyd", coverImage: "https://..." }
```

---

### @crawl/follow

Finds links on a page and adds them to the session queue. Only same-domain links are kept. Already-visited URLs are deduplicated.

```
@crawl/follow session=<session> input=<page> [follow=<selector-or-text>]
```

| Arg | Required | Default | Description |
|-----|----------|---------|-------------|
| `session` | Yes | — | Active crawl session |
| `input` | Yes | — | A page from `@crawl/page` |
| `follow` | No | — | CSS selector or link text (overrides learned selectors) |

**With explicit `follow=`:**

```oto
// CSS selector
@crawl/follow session=session input=page follow="a.next-page"

// Text match — finds <a> elements containing "Next Page" (case-insensitive)
@crawl/follow session=session input=page follow="Next Page"
```

**With learned selectors** (no `follow=` arg) — uses `session.learnedSelectors.follow` from `@crawl/example`.

If the selector matches zero links, the command succeeds with an empty result and logs a warning. This is not an error — the queue may still have other URLs from previous pages.

---

## Full Programs

### One-shot: fetch a page as markdown

```oto
@crawl/fetch url="https://example.com/pricing" output=page
@ai/generate prompt={["Summarize this pricing page:\n", page]|join} output=summary
```

### Full crawl with AI-learned selectors

```oto
@crawl/session/open url="https://forum.com/topics" limit=500 maxRequestsPerMinute=10 output=session

@crawl/example url="https://forum.com/topics/123" prompt="Extract thread title, author, date. Follow next page links." session=session
@crawl/example url="https://forum.com/topics/456" session=session

@block/begin while={session.hasNext}
  @crawl/page session=session output=page
  @crawl/extract session=session input=page output=data
  @file/save file={["~/storage/threads/", _index, ".json"]|path} content=data
  @crawl/follow session=session input=page
@block/end
```

### Manual selectors (no AI)

```oto
@crawl/session/open url="https://blog.example.com" limit=20 output=session

@block/begin while={session.hasNext}
  @crawl/page session=session output=page
  @crawl/extract input=page selector="h1.post-title" output=title
  @crawl/extract input=page selector="div.post-body" as="markdown" output=body
  @file/save file={["~/storage/posts/", _index, ".md"]|path} content=body
  @crawl/follow session=session input=page follow="Next"
@block/end
```

### Human-in-the-loop

```oto
@crawl/session/open url="https://shop.com/products" limit=200 output=session

@crawl/example url="https://shop.com/products/1" prompt="Extract product name, price, image. Follow pagination." session=session

@block/begin while={session.hasNext}
  @crawl/page session=session output=page
  @crawl/extract session=session input=page output=product

  @human/validation if={session.pageCount % 10 == 0} items=product applet="grid"

  @file/save file={["~/storage/products/", _index, ".json"]|path} content=product
  @crawl/follow session=session input=page
@block/end
```

### Extracting images

```oto
@crawl/fetch url="https://gallery.example.com/albums/rock" selector="img.album-cover" as="images" output=covers
@block/begin forEach=covers -> url
  @file/save file={["~/storage/covers/", _index, ".jpg"]|path} content=url
@block/end
```

---

## Architecture

### Adapter pattern

All HTTP fetching goes through a `CrawlAdapter` interface. Two implementations exist:

| Adapter | Wraps | Use case |
|---------|-------|----------|
| `CrawleeAdapter` | `@crawlee/cheerio` (CheerioCrawler) | Production — rate limiting, robots.txt, retries |
| `SimpleCrawlAdapter` | Native `fetch` + `cheerio` | Testing, lightweight use |

The adapter returns a `CrawlPage` object with parsed Cheerio DOM, ready for CSS selector queries.

### Session lifecycle

```
@crawl/session/open   →  creates CrawlSession (queue + config)
@crawl/example (0..N) →  AI populates learnedSelectors
@crawl/page           →  dequeues URL, fetches, increments pageCount
@crawl/extract        →  reads page DOM with selectors
@crawl/follow         →  finds links, adds to queue (deduped)
                          loop continues while session.hasNext
```

The session is garbage-collected when the variable goes out of scope. No explicit close command.

### Dependencies

| Package | License | Purpose |
|---------|---------|---------|
| `@crawlee/cheerio` | Apache 2.0 | HTTP crawling, rate limiting, robots.txt |
| `cheerio` | MIT | HTML parsing, CSS selector queries |
| `turndown` | MIT | HTML to markdown conversion (`as="markdown"`) |

**Excluded:** `apify`, `apify-client`, `@apify/*`, `crawlee` (umbrella), `playwright`, `puppeteer`.
