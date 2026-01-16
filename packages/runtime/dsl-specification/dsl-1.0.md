# DSL 1.0 Specification (Target)

This document describes the **planned features** for DSL 1.0, based on the `/documentation` folder.
These features are NOT yet implemented.

## New in 1.0 (vs 0.5)

### Comments

```oto
// Line comment
/* Multi-line
   comment */
```

### Empty Argument Shorthand (React convention)

```oto
@print/users users=users displayParent=true
@print/users users=users displayParent  // equivalent
```

### Mapping Tokens

```oto
monitors->name    // maps monitors array to name property
{tweets->id}      // shorthand for {tweets:mappedBy:'id'}
```

### Templates

```oto
#robusta/seoGrab options="store.seoOptions"
```

Templates are namespaced reusable instruction sets.

### Options Keyword

Flattens an object to pass multiple arguments:

```json:ideas
{
  "title": "My title",
  "description": "My description",
  "tags": ["tag1", "tag2"]
}
```

```oto
@seo/kwGrab options=ideas output=keywords
// Equivalent to:
@seo/kwGrab title="My title" description="My description" tags={ideas.tags} output=keywords
```

### Control Flow: Inline Modifiers

All instructions can have `if`, `forEach`, `while`, `pause`, `stream`:

```oto
@print/users users={users:tail:10} if={i < 2}
@print/users users={users:tail:10} if=foundUser
@debug/print var=name forEach=monitors->name
@math/increment input=i step=2 while={i < 10}
```

### Control Flow: Blocks

#### ForEach Block

```oto
@begin/forEach item="monitor" of=monitors index="i"
  @alert/notify monitor={monitor} index={i}
@end/forEach
```

- `item` (required): string literal naming the loop variable
- `of` (required): expression evaluating to iterable
- `index` (optional): string literal for zero-based index

#### If Block

```oto
@begin/block if={foundUser}
  @print/users users={users:tail:10}
  @email/send template="welcome" users={users}
@end/block
```

#### While Block

```oto
@begin/block while={i < 10}
  @utils/doSomething value={i}
  @utils/increment input={i} output=data.i
@end/block
```

### Nested Blocks

```oto
@begin/forEach item="monitor" of=monitors index="i"
  @begin/block if={monitor.status == "ERROR"}
    @alert/notify monitor={monitor} index={i}
  @end/block
@end/forEach
```

### String Interpolation

```oto
@mail/send to="${user.email}" subject="Welcome ${user.name}"
```

Follows JavaScript `${}` syntax.

### Multiline Commands

```oto
@seo/kwGrab
    title="My title"
    description="My description"
    tags={tags.list}
    output=keywords
```

### Package Versioning (Future)

```oto
@build.robusta/crawl/data^1.0.0
@build.robusta/crawl/data^snapshot
```

### Streaming

Tasks can be streamed for partial results before execution completes.

## Execution Context

```typescript
interface ExecutionContext {
  env: Record<string, string>     // read-only, not saved
  data: Record<string, any>       // main data store
  extra: any
  meta: {
    tool?: string
    history: InstructionLog[]
    updatedAt: ReadableDate
  }
  user: {
    id: string
    extra: Serializable
  }
  store: SerializableStorePointer
  prompts: string[]
  cost: {
    current: number    // current cost in cents
    estimated: number  // estimated cost in cents
    maximum: number    // max allowed for this run
    credits: number    // user credits available
  }
}
```

## Resolution Rules

| Path | Resolves To |
|------|-------------|
| `users` | `context.data.users` |
| `data.users` | `context.data.users` |
| `env.API_KEY` | `context.env.API_KEY` |
| `store.foo.bar` | `context.store['foo.bar']` |
| `user.id` | `context.user.id` |
| `cost.current` | `context.cost.current` |

## Output Targets

Output must start with a reserved path:
- `data.` - main data store (default if omitted)
- `store.` - persistent store
- `prompt.` - prompt storage

`env.` is read-only.

## Reserved Packages

### Language

```
@debug, @math, @date, @string, @array, @object, @flow, @condition, @loop
```

### Companies

```
@robusta, @massivoto, @masala
```

### Business

```
@seo, @kw, @marketing, @social, @code, @human, @report, @crawl, @monitor,
@content, @analytics, @email, @crm, @sales, @ecommerce, @pricing, ...
```

### Tooling

```
@cms, @ai, @llm, @auth, @webhook, @scheduler, @queue, @storage, @cdn,
@db, @search, @http, @fetch, @proxy, @cron, @validate, @test, @mock, ...
```

## Markdown Integration

Massivoto documents are markdown with embedded code blocks:

    ```oto
    @tweeter/users ids={tweets->id} output=users
    @package/command2 args=value
    ```

Data can be defined in JSON/YAML blocks:

    ```json:data.key
    {
      "value": 12,
      "name": "John"
    }
    ```

## Goto and Label

Reserved for future use. Not defined in 1.0.
