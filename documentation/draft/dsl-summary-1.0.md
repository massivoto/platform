# DSL

This DSL is designed to write an automation language, easy for developers. It’s
made to be mostly written by AI, so there is no syntactic sugar

## Terminology

- `@print/users` : Command
    - `@print/users/payment` : Subcommand
- `size=2` : argument
- `{users:orderBy:followers}` : Pipe expression
- `#robusta/seoGrab options="store.seoOptions"` : Template
- `monitors->name` is a mapping token.
  - `monitors` is an array of objects, `name` is a string

## Spirit

### Goals:

- Easy to write with AI
    - Minimal syntactic sugar rule to avoid ambiguity
- Easy to write for coders
- Easy to read for beginners
  - Non tech if they are motivated

### Non goals

- Usable for non-tech : good if they are motivated, but not a target
- Having syntactic sugar

### Rules

- React convention: tag is the function name. Attributes are arguments
- React convention: empty argument is true
  - This is a RARE syntactic sugar
- Angular convention: pipe syntax
- The main concept is NO AMBIGUITY
- Like with Angular, a token can be either a string, an object path or a
  variable value
  - {users:orderBy:'followers'} : `users` is an array value, `orderBy` a string
    representing the operation, `followers` a string representing the field
- `{tweets:mappedBy:'id'}` accepts `{tweets->id}` as shorthand
- @package/command user={monitor} forEach=monitors->monitor

## Reserved keywords

There is a list of reserved keywords for attributes:

```markdown
'true','false','for','forEach','for-each','in','if','else','endif','repeat','while','function','return','break','continue','switch','case','default','let','const','var',
'input', 'output', 'goto', 'label', 'options'
```

### Reserved packages

Language

```markdown
@debug, @math, @date, @string, @array, @object, @flow, @condition, @loop
```

Companies

```markdown
@robusta, @massivoto, @masala
```

You are not allowed to create an organisation with known names of famous brands,
even if you own the brand and the tld is different. Name squatting is not
allowed.

Business cases

```markdown
@seo, @kw, @marketing, @market, @social, @code, @gate, @human, @report, @crawl,
@monitor, @content, @local, @schema, @audit, @abtest, @landing, @i18n, @reviews,
@ads, @analytics, @email, @crm, @sales, @growth, @ecommerce, @catalog, @pricing,
@leadgen, @outreach, @affiliate, @partner, @appstore, @branding, @design, @ux,
@ui, @copy, @video, @podcast, @webinar, @community, @influencer, @reputation,
@conversion, @revenue
```

Tooling

```markdown
@cms, @ai, @llm, @auth, @webhook, @scheduler, @queue, @storage, @cdn, @etl,
@render, @vault, @db, @search, @index, @http, @fetch, @proxy, @retry, @cron,
@validate, @test, @mock, @logger, @metrics, @trace, @alert,
```

## File Path Literals (v0.6+)

File paths and glob patterns are first-class literals, prefixed with `~/`:

```oto
@ai/describe image=~/images/hero.png output=description
@block/begin forEach=~/images/races/*.jpg -> photo
  @ai/describe image={photo} output=description
@block/end
@core/files/save data=results path=~/output/results.json
```

- `~/path/to/file.ext` -> `FileLiteralNode` (type: `literal-file`)
- `~/path/*.ext`, `~/path/**/*.ext` -> `GlobLiteralNode` (type: `literal-glob`)
- `~/` prefix is kept in the AST `.value`
- `..` path traversal is rejected at parse time (security)
- Trailing slash accepted and normalized: `~/images/` -> `~/images`

## examples

```oto

@llm/generateImage prompt="art for music in a clean room"

@crawler/open url="https://www.google.com"
@crawler/click selector="@accept-google" // click on the button that accept cookies
@seo/googleSuggest input=haiku output=suggest

@tweeter/users  ids={tweets:mappedBy:id} output = users. # exact equivalent
@print/users users={users:orderBy:followers}
@print/users users={users:tail:10}
@print/users users={users:first:10}
@print/users users={monitors:keys}
@print/users users={monitors:values}

@mail/send to="${user.email}" subject="Welcome" provider="gmail"
@db/query sql="SELECT * FROM users WHERE active=1" output=activeUsers

```

AI Prompt:

> Write me 10 articles about "dakar surf" for SEO purposes Let me validate 10
> keywords and one image per keyword

DSL Generated:

```prompt:surfPrompt:keywordSet
Generate a Hero image with tags:${keywordSet}
```

```oto
@seo/kwGrab tags={["dakar surf"]} output=keywords number=20
@human/validate presentation="grid" items={keywords} output=validatedKeywords number=10
@llm/generateImage prompt=surfPrompt output=surfImages forEach=validatedKeywords->keywordSet
@content/writeManyArticles topics={keywords} images={images} output=articles
```

## Code structure

### Execution context

The execution context is the main object that is passed to each command. It
contains all the necessary information for the command to execute, including
environment variables, data, user information, and metadata.

The exection context will also receive updates after each command, including
data updates defined by the user, but also costs updates, metadata updates (like
history).

```tsx
interface ExecutionContext {
  env: Record<string, string> // will not be saved nor shared
  data: Record<string, any>
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
    current: number // current cost in cents
    estimated: number // estimated cost in cents
    maximum: number // maximum cost allowed by the user for this run
    credits: number // credits available for the user
  }
}
```

### Instruction

```tsx
interface Instruction {
  command: string // e.g., "@print/users"
  arguments: Record<string, Expression> // e.g., { users: "users:orderBy:followers" }
}
```

## Execution context

## Resolution Rules

## Conditions

All instruction can have `if` and/or `forEach` and/or `while` and/or `pause`
and/or `stream`

TODO: find a `forEachKey` equivalent

```oto
@print/users users={users:tail:10} if={i<2} // i taken from cxt.data.i
@print/users users={users:tail:10} if=foundUser // from cxt.data.foundUser
@print/users users={users:tail:10} if=true

```

```oto
@print/users data={users:tail:10} while={i<2} // i taken from cxt.data.i
@print/users data=name forEach={monitors->name} // problem for 'monitor'
@print/users data=users if=true

```

## True/false

if no right part is present, then it’s a boolean attribute. This is decorative,
so another preparser will add it when the feature will be enabled. The
convention is taken from React.

```oto

@print/users users=users displayParent=true
@print/users users=users displayParent  //equivalent

```

## Output

A command is a function, so it will most of the time return a value

Output will modify context.data, giving the path.

Output CAN start with a reserved path : `“data.”`, `“store.”` or `“prompt.”`
However `.env` is read-only.

If no reserved path is given, it will be prefixed with `“data.”`

```oto
// users is a shorthand for data.users
@tweeter/users  ids={tweets:mappedBy:'id'} output = users

// nicolas.friends is a shorthand for data.nicolas.friends
@tweeter/users  ids={tweets:mappedBy:'id'} output = nicolas.friends
```

### Special case with output

When no output is specified, the context will not change. If output

## Markdown

A Massivoto document is just markdown.

Massivoto set of instructions will be given as code with : ` ```massivoto ` or
` ```oto `, just like `typescript` or `ts`

        Text around is comment

        ```oto
        @tweeter/users  ids={tweets->id} output=users
        @package/command2 args=value
        ```

        Other block of text

We can set some parameters into variable using json, toml or yaml:

```json:data.key

{
    value:12,
    name:"John"
}

```

By default, json is JSON5 format. In the context object, `data.key` will receive
the value

In the future, other instruction set can happen:

```curl:data.key
   curl https://www.robusta.build
```

JSON is important, as the pipe expression don't accept arrays nor objects

You CAN'T write this:

```oto
@seo/kwGrab tags={["tag1","tag2"]}
@seo/kwGrab tagMap={{tag1:"value1",tag2:"value2"}}
```

But you CAN write this:

```json:tags
{
 list:["tag1","tag2"]
 map:{tag1:"value1",tag2:"value2"}
}
```

Then use it later:

```oto
    @seo/kwGrab tags={tags.list}
    @seo/kwGrab tagMap={tags.map}
```

## Pipe expression

Follow Angular rules

## Comments

The comments are not valid in the markdown raw text, but are inside massivoto
code blocs

Line comment: // Multiline comments : /_ .... _/

## options keyword

Options will flatten an object to pass multiple arguments

```json:ideas
{
    "title":"My title",
    "description":"My description",
    "tags":["tag1","tag2"]
}
```

```oto
 @seo/kwGrab options=ideas output=keywords
```

This is equivalent to

```oto
 @seo/kwGrab title="My title" description="My description" tags={["tag1","tag2"]} output=keywords
```

## Bloc

// To be defined

See block section in documentation/bloc-rules.md

## Goto and Label

// To be defined

## String interpolation

String interpolation follow JavaScript rules, with `${}` syntax For
simplification, it could also be possible to use `{}` directly without `$`

The difficulty is for escaping. kotlin 2 differs between `${}` and `$${}` There
is also a difficulty with variants of quotes : single, double, backtick

// To be defined

## Multiline command

A command can be multiline, as long as it is inside a code bloc.

```oto
@seo/kwGrab
    title="My title"
    description="My description"
    tags={["tag1","tag2"]}
    output=keywords
```

## Streaming

Different tasks can be streamed. This is a way to have partial results before
the end of the execution.

## Package and Templates

Command and Templates are namespaced by packages.

In 0.5, packages are an identifier : @package/commandName

In the future, packages can have paths and can be versioned :

    @package/commandName

    @build.robusta/crawl/data^1.0.0
    @build.robusta/crawl/data^snapshot (find better)

Une organisation va par défaut avoir accès à son registry, donc peut juste

    @crawl/data  // crawl fait partie du registry de l'organisation


## Spawning servers 

We can spawn servers with route, leverage expressJs or others api

@spawn/start type="ws" id="serverId"

// req is injected to the request scope
@server/route path="/myroute" goto="handlerMyroute" output="req"
@server/route path="/otherroute" goto="handlerOtherroute" output="req"

@spawn/end 

// trigger is another option than label, mais ne s'execute pas sans appel externe
@sheet/set trigger="handlerMyroute" column=2 row=12  value="Hello World"

