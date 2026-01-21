# Massivoto APL Roadmap

## Version Strategy

| Version | Goal                                  | Target           |
| ------- | ------------------------------------- | ---------------- |
| **0.5** | Local execution for product discovery | Personal use     |
| **1.0** | Production SaaS                       | Paying customers |
| **1.5** | Developer experience & adoption       | Growth           |

---

## v0.5 - Local Execution

The goal is to have a working local runner to validate the product concept.

### Variable Resolution & Scope

Variables can exist at three levels:

| Level                | Source                                                  | Lifetime                 | Example                                                   |
| -------------------- | ------------------------------------------------------- | ------------------------ | --------------------------------------------------------- |
| **Scope**            | Program-local, created by `output=`, `forEach` iterator | Within program execution | `output=result` creates `result` in executionContext.data |
| **ExecutionContext** | External, passed in from runner/caller                  | Across program           | API credentials, input data                               |

But also context.store

scope: very short lifetime, mostly for forEach, transient. Deleted out of a
block data: longer lifetime, across program execution and serializable. deleted
at the end of program store: persistent across executions and programs

**Resolution rule:** data by default, scope wins on collision.

suppose we write this:

    @api/call output=user -> creates executionContext.data.user
    @api/call output=scope.user -> creates executionContext.scope.user
    @api/call output=store.user -> will send a write-query to executionContext.store->user

Note that store will not be implemented in 0.5

```
ExecutionContext: { user: "external-user", token: "xxx" }
Program:
  @utils/set input="john" output=user    # creates executionContext.data.user
  @utils/set input="john" output=scope.user    # creates executionContext.scope.user
  @log/print msg=user      # uses scope.user (shadows context.data.user)
```

**Implementation needs:**

- [ ] Separate `executionContext.scope` from `executionContext.data` in runtime
- [ ] Variable lookup: check scope first, then data
- [ ] Variable assignment: `output=x` writes to data, `output=scope.x` writes to
      scope
- [ ] Clear scope semantics for nested blocks (forEach body has its own scope?)

**PRD:**
[variable-scope.prd.md](packages/runtime/src/compiler/interpreter/variable-scope.prd.md)

### Mapping & Transformation

- [ ] **Mapper pipe**: `$data | map transform="..."`
- [ ] **ForEach mapping**: iterate and transform collections

## Code Comments

- [x] **Line comments**: `// this is a comment` - ignore rest of line
- [x] **Block comments**: `/* ... */` - ignore everything between delimiters
- [x] **String awareness**: comments inside `"..."` are NOT stripped
- **PRD:** [comments.prd.md](packages/runtime/src/compiler/parser/comments.prd.md)

### Cleanup (end of v0.5)

- [ ] **Remove normalizers**: `normalizeIf`, `normalizeForEach` - interpreter
      should handle `condition` directly on `InstructionNode`
- [ ] **Document braced expressions**: `{expr}` was added to
      `full-expression-parser.ts` for `if={condition}` but is not documented in
      `expression-grammar.md`. Braced expressions should be first-class citizens
      in the expression grammar documentation, not a hidden feature.

### Syntax Strictness

- [x] **No spaces around `=`**: `key=value` only, reject `key = value` and
      `key= value`

### Parser Enhancements

- [x] **Block parsing**: `@block/begin ... @block/end` statement groups
  - [x] Optional `name="label"` argument
  - [x] Optional `if=condition` argument for conditional blocks
  - [x] Arbitrary nesting depth supported
- [ ] **ForEach statement**: `@forEach item of items { ... }`
- [ ] **Goto/Label**: control flow jumps for complex workflows
- [ ] **Unary operators**: 2 skipped tests in `unary-parser.spec.ts` need
      investigation
- [ ] **Error format**: Errors sent need to be absolutely readable by a LLM

### Evaluator

- [x] **Complete node coverage**: handle all AST node types (binary, unary,
      logical, member, array, pipe)
- [ ] **Async evaluator**: `evaluate()` must be async to support `store.x`
      lookups (store is async)
- [ ] **Block evaluation**: evaluate `BlockNode` sequences
- [ ] **Pipe evaluation**: execute pipe chains with data transformation
- [ ] **Error format**: Errors sent need to be absolutely readable by a LLM

### Action Resolution System

**Action** (product) → **CommandRegistry** (binding) → **Command** (technical).

#### CommandRegistry

The resolver maps an Action to one or more Commands based on arguments.

Example: `@ai/generate model="gemini"` resolves to `GeminiCommand`, while
`model="sonnet"` resolves to `SonnetCommand`.

- [ ] **CommandRegistry implementation**: resolve Action + args → Command(s)
- [ ] **Argument-based routing**: different handlers based on arg values
- [ ] **Command bundles**: package related commands together
- [ ] **Error format**: Errors sent need to be absolutely readable by a LLM

#### CredentialVault and ProviderRegistry

A provider gives a service and an API to the service. Most providers require
authentication: OAuth, API key, API key+secret, etc.

This lives in apps/auth and services/auth-backend.

For 0.5, the vault runs locally without encryption. Secure storage is deferred
to 1.0.

**ProviderRegistry** - Maps provider codes to authentication handlers:

- [ ] **ProviderRegistry interface**:
      `getProvider(code: string) → ProviderDriver`
- [ ] **Provider authentication**: initiate OAuth or API key flows
- [ ] **Token retrieval**: fetch valid tokens from auth-backend storage
- [ ] **Token validation**: check expiry before use
- [ ] **Token refresh**: automatic refresh when expired (OAuth only)
- [ ] **Token revocation**: invalidate tokens on disconnect

**CredentialVault** - Supplies credentials to commands at runtime:

- [ ] **CredentialVault interface**:
      `getCredential(providerId: string) → Credential`
- [ ] **Integration with auth-domain**: bridge to existing OAuth token storage
- [ ] **Credential types**: OAuth tokens, API keys, connection strings
- [ ] **Credential injection**: commands declare required providers, vault
      injects at runtime

### Environment & Secrets

- [ ] **Env section spec**: define where secrets from auth component are stored
- [ ] **Secret injection**: how ExecutionContext.env gets populated
- [ ] **Local vs remote**: different secret handling for local runner vs SaaS

### Local Runner

- [ ] **File-based execution**: run `.oto` files from command line
- [ ] **Local store**: file-based state persistence
- [ ] **REPL mode**: interactive execution for debugging

### Cost Management (Draft)

Pre-execution cost estimation for pricing decisions.

- [ ] **Cost model**: define cost types (AI tokens, subscriptions, per-command)
- [ ] **Pre-flight estimation**: calculate expected cost before execution
- [ ] **Cost tracking**: record actual costs during execution

### Applets: Human Validation Checkpoints

Between commands, deploy a mini web app for human input, called Applets.

For v0.5: Applets run on localhost with dynamic ports. For v1.0: SaaS deployment
with proxy routing per user session.

**AppletRegistry** - Maps applet names to UI components:

- [ ] **AppletRegistry interface**: `getApplet(name: string) → AppletDefinition`
- [ ] **Built-in applets**: `confirm` (approve/reject), `grid` (multi-select),
      `form` (input fields)
- [ ] **Applet selection**: action arg `applet="grid"` or default per command

**Applet Lifecycle**:

- [ ] **Applet spawner**: start applet server on available port
- [ ] **URL generation**: create shareable link to validation page
- [ ] **Session state**: track pending validation per execution
- [ ] **Continuation**: resume execution after user confirms
- [ ] **Timeout handling**: auto-reject or pause after configurable duration

**Applet UI**:

- [ ] **Confirm applet**: text + approve/reject buttons
- [ ] **Grid applet**: array selection with checkboxes
- [ ] **Form applet**: dynamic input fields based on schema

## Common Registry Interface & Reload

Three registries share the same extension pattern: CommandRegistry,
ProviderRegistry, AppletRegistry.

**Deployment model:**

- Massivoto ships core items in `@massivoto/runtime`
- On-premise clients extend via their own npm modules (e.g.,
  `@acme/custom-cmds`)
- Registries merge core + custom at runtime, with reload capability

**RegistryBundle pattern:**

```
RegistryBundle<V>
  id: string                     // "core" | "@acme/custom-cmds"
  load(): Promise<Map<string, V>>
  watch?(): AsyncIterable<Event> // for hot reload
```

Each registry composes multiple bundles, later bundles can override earlier
ones.

**Design decisions (to resolve during implementation):**

- [ ] Override behavior: custom overrides core silently, or namespaced, or
      error?
- [ ] Module contract: what shape must client npm modules export?
- [ ] Discovery: config file listing extensions, or scan node_modules for
      marker?
- [ ] Hot reload trigger: file watcher, API call, or signal?

**Implementation tasks:**

- [x] Define `RegistryBundle<V>` interface
- [x] Implement `CoreHandlersBundle` for built-in items
- [ ] Implement `NpmModuleBundle` for dynamic import from node_modules
- [x] Add `addBundle()` and `reload()` to CommandRegistry
- [ ] Apply same pattern to ProviderRegistry and AppletRegistry

## Interface and communication between deployed components

When the program will run, we'll need multiple deployed systems, such as:
CommandRegistry, CredentialVault, AppletRegistry

We need to define the interface and communication between these components.
Also, one component can be able to deploy another, such as a command will deploy
an applet. This must be testable will dummy implementations.

---

## v1.0 - Production SaaS

Paying customers require reliability, security, and easy deployment.

### Error Handling

This is a major topic that needs a dedicated PRD. For now, we list the main points when we will explore 0.5.

### Identifier Semantics

There are two distinct uses of identifiers that share the same AST type but have
different runtime semantics:

| Use                  | Example         | Semantics                          | Current Type     |
| -------------------- | --------------- | ---------------------------------- | ---------------- |
| **Value identifier** | `arg1=myValue`  | Evaluated from context             | `IdentifierNode` |
| **Key identifier**   | `output=result` | Used as variable name (string key) | `IdentifierNode` |

The same problem applies to:

- `output=varName` - `varName` is a key, not a value
- `forEach="item of items"` - `item` is a key (iterator variable), `items` is a
  value

**Problem:** Both use `IdentifierNode` but:

- Value identifiers are evaluated: `context.get("myValue")`
- Key identifiers are used as strings: `context.set("result", value)`

**Options to explore:**

- [ ] **Separate AST types**: `KeyIdentifierNode` vs `ValueIdentifierNode`
- [ ] **Single type with flag**:
      `IdentifierNode { value: string, isKey?: boolean }`
- [ ] **Context-based**: Let the interpreter/evaluator know based on position
      (output.target is always a key)

This affects the evaluator and needs resolution before forEach implementation.

-> Creating a type of SimpleString LiteralNode for keys could be a solution. It
may not be needed. Will be evaluated from 0.5.

### Parser Type System

- [ ] **Pipe type checking**: reject invalid pipe chains (e.g., mapper expects
      array, gets number)
- [ ] **Argument type hints**: optional type annotations for validation
- [ ] **Error messages**: clear type mismatch diagnostics

### SaaS Runner

- [ ] **Cloud execution**: stateless runner for AWS Lambda or ECS
- [ ] **Terraform modules**: infrastructure-as-code for deployment
- [ ] **Multi-tenant**: isolated execution contexts per customer
- [ ] **Monitoring**: execution logs, metrics, alerting

### Production Hardening

- [ ] **Rate limiting**: protect against abuse
- [ ] **Execution timeouts**: prevent runaway scripts
- [ ] **Cost limits**: hard caps per user/execution
- [ ] **Audit logging**: compliance-ready execution history

---

## v1.5 - Developer Experience

Focus on adoption and usability, no new runtime features.

### IDE Integration

- [ ] **Monaco integration**: web-based code editor
- [ ] **Language Server Protocol (LSP)**: real-time parsing and error reporting
- [ ] **Line/column tracking**: parser tracks source positions for error
      messages and diagnostics
- [ ] **AST error recovery**: parser produces partial AST on syntax errors
- [ ] **Syntax highlighting**: OTO language definition for editors
- [ ] **Autocomplete**: action and argument suggestions

### User-Defined Extensions

#### Hotloader Command Registry

- [ ] **Upload custom handlers**: users add their own JS code
- [ ] **Sandboxed execution**: security isolation for user code
- [ ] **Version management**: handler versioning and rollback

#### Templates

- [ ] **Reusable programs**: define parameterized OTO scripts
- [ ] **Template library**: share templates across users
- [ ] **Composition**: templates calling other templates

### Deployment Options

- [ ] **Dedicated servers**: single-tenant deployment
- [ ] **On-premise**: customer-hosted with Terraform
- [ ] **Docker Compose**: simple self-hosted option
- [ ] **New runner types**: adapt runner interface for each deployment model

---

## Terminology

| Term                 | Layer          | Definition                                                 |
| -------------------- | -------------- | ---------------------------------------------------------- |
| **OTO**              | Language       | The DSL language (files: `.oto`)                           |
| **Action**           | Product        | What the user writes: `@package/name args...`              |
| **Command**          | Technical      | TypeScript class that executes an action                   |
| **CommandRegistry**  | Binding        | Maps Action + args → Command(s)                            |
| **ProviderRegistry** | Binding        | Maps provider codes → ProviderDrivers                      |
| **ProviderDriver**   | Technical      | Handles OAuth flow for a specific provider (name TBC)      |
| **AppletRegistry**   | Binding        | Maps applet names → validation UI components               |
| **CredentialVault**  | Infrastructure | Supplies OAuth tokens/API keys to commands at runtime      |
| **RegistryBundle**   | Infrastructure | Loadable bundle of registry items (core, npm module, file) |
| **Applet**           | Infrastructure | Temporary UI for human validation during execution         |
| **Runner**           | Infrastructure | Execution environment (Local, SaaS, On-Premise)            |
| **Store**            | Infrastructure | State persistence backend (file, S3, database)             |

---

## Open Questions

1. **Goto/Label semantics**: How do labels interact with blocks and loops?
2. **Validation app**: Separate service or embedded in runner?
3. **Type system depth**: How strict should pipe type checking be in v1.0?
4. **ProviderDriver naming**: Is "Driver" the right term? Alternatives:
   ProviderAdapter, ProviderHandler, AuthProvider?
