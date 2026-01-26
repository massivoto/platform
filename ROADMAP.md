# Massivoto APL Roadmap

## Version Strategy

| Version | Goal                                  | Target           |
|---------|---------------------------------------|------------------|
| **0.5** | Local execution for product discovery | Personal use     |
| **0.8** | Licensing & legal foundation          | Open source ready |
| **1.0** | Production SaaS                       | Paying customers |
| **1.5** | Developer experience & adoption       | Growth           |

---

## v0.5 - Local Execution

The goal is to have a working local runner to validate the product concept.



### Cleanup (end of v0.5)

- [ ] **Document braced expressions**: `{expr}` was added to
  `full-expression-parser.ts` for `if={condition}` but is not documented in
  `expression-grammar.md`. Braced expressions should be first-class citizens
  in the expression grammar documentation, not a hidden feature.


### Parser Enhancements

- [ ] **Error format**: Errors sent need to be absolutely readable by a LLM

### Evaluator

- [ ] **Pipe evaluation**: execute pipe chains with data transformation
- [ ] **Error format**: Errors sent need to be absolutely readable by a LLM

### AST Processing Pipeline

Once the AST is built, a processing pipeline validates and transforms it before
execution. This keeps the parser simple (syntax only) and centralizes semantic
checks.

- [ ] **Pipeline architecture**: define pre-processing and post-processing phases
- [ ] **Duplicate label detection**: reject programs with duplicate `label` args
- [ ] **Unknown goto target**: reject `@flow/goto target="x"` if no `label="x"`
- [ ] **Template expansion**: resolve `#template` references (v1.0)
- [ ] **Options merging**: merge `options` blocks with command args (v1.0)
- [ ] **Markdown extraction**: extract documentation comments (v1.0)

### CredentialVault and ProviderRegistry

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

### ExecutionContext Refactoring

**Problem:** `ExecutionContext` mixes context concerns with program-level concerns:
- Context concerns: `data`, `scopeChain`, `env`, `extra` (variable state)
- Program concerns: `meta.history`, `cost` (execution tracking)

**Refactoring:**
- [ ] **Separate concerns**: `ExecutionContext` holds only `data`, `scopeChain`, `env`, `extra`
- [ ] **ProgramResult owns execution data**: move `history` and `cost` to `ProgramResult`
- [ ] **Update interpreter**: pass history/cost separately from context
- [ ] **Cost limits at program level**: cost management can terminate execution when exceeded

This enables cleaner separation and allows cost management to be a program-level concern
that can halt execution.

### Cost Management (Draft)

Pre-execution cost estimation for pricing decisions.

- [ ] **Cost model**: define cost types (AI tokens, subscriptions, per-command)
- [ ] **Pre-flight estimation**: calculate expected cost before execution
- [ ] **Cost tracking**: record actual costs during execution (in ProgramResult, not context)

### Applets: Human Validation Checkpoints

Between commands, deploy a mini web app for human input, called Applets.

For v0.5: Applets run on localhost with dynamic ports. For v1.0: SaaS deployment
with proxy routing per user session.

Applets are testable ! deployment, api, UI interaction and termination must be
tested headlessly (ex: supertest + playwright)

**AppletRegistry** - Maps applet names to UI components:

- [X] **AppletRegistry interface**: `getApplet(name: string) → AppletDefinition`
- [ ] **Built-in applets**: `confirm`, `grid`, `generation` (input fields)
- [ ] **Applet selection**: action arg `applet="grid"` or default per command
- [ ] **Standard Massivoto UI**, with SEO link to massivoto.com

**Three standard Applets**:

- [ ] **Confirm applet**: text + approve/reject buttons
- [ ] **Grid applet**: array selection with checkboxes
- [ ] **Generation applet**: generated and editable text associated with input
  items

Also every applet have a non-ui input that is sufficient

- [ ] **Rest api** : send to the api backend the POST query with user inputs
- [ ] **Command cli** : a Commander cli is able to send inputs

Applet package.json file should enable a run ; also maybe it should produce a bin that is callable from the command line.
And also produce a docker container. This can be generic for all applets.

## Common Registry Interface & Reload

Four registries share the same extension pattern: CommandRegistry,
ProviderRegistry, AppletRegistry, PipeRegistry

**Deployment model:**

- Massivoto ships core items in `@massivoto/runtime`
- On-premise clients extend via their own npm modules (e.g.,
  `@acme/custom-cmds`)
- Registries merge core + custom at runtime, with reload capability

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

User Story:

En tant que runtime, quand j’exécute une commande liée à une applet, je veux interroger le package OAuth backend pour
récupérer le token associé à l’utilisateur concerné. Le runtime doit savoir identifier l’utilisateur et dans quelle base
de données aller chercher ces tokens. Ainsi, le runtime aura les droits nécessaires pour exécuter les actions de
l’applet en utilisant les bons jetons.

Acceptance criteria:

1. Le runtime est capable d’identifier l’utilisateur à partir de la commande exécutée
2. Le runtime sait vers quelle base de données pointer pour retrouver les tokens.
3. Le package OAuth backend fournit le token correct en réponse à la requête.
4. En cas d’utilisateur inconnu ou de token absent, une erreur claire est renvoyée.
5. Le runtime peut utiliser le token récupéré pour authentifier l’exécution de l’applet avec succès.


---

## v0.8 - Licensing & Legal Foundation

Prepare for public release with proper licensing and legal framework.

See `license.prd.md` for full details.

### Licensing Implementation

- [ ] **Implement hybrid licensing**: BSL 1.1 for runtime, Apache 2.0 for other packages
- [x] **Add LICENSE files**: Apache 2.0 at root (BSL for runtime deferred)
- [ ] **License headers**: Add BSL header to runtime source files
- [x] **NOTICE file**: Third-party attributions
- [x] **CONTRIBUTING.md**: Explain license per package, CLA for runtime

### Runtime Package Split (BSL Extraction)

See `packages/runtime/runtime-split.wip.prd.md` for full details.

Split `@massivoto/runtime` into:
- **Apache 2.0** (`@massivoto/runtime`): Parser, AST, domain types, interfaces, LocalRunner shell
- **BSL 1.1** (`@massivoto/runtime-engine`): Interpreter, evaluator, core handlers, core pipes

- [ ] **Extract interfaces**: `IInterpreter`, `IEvaluator`, `IPipeFunction`, `ICommandRegistry`
- [ ] **Refactor LocalRunner**: Accept `IInterpreter` via dependency injection
- [ ] **Create BSL repo**: `massivoto-runtime-engine` with interpreter implementation
- [ ] **Move strategic code**: Interpreter, evaluator, CoreHandlersBundle, CorePipesBundle
- [ ] **Integration tests**: Verify Apache + BSL packages work together

### massivoto-custom Repository

- [ ] **Create massivoto-custom repo**: Template monorepo for companies to extend Massivoto
- [ ] **Extension patterns**: Document how to add custom commands, pipes, applets
- [ ] **Clean upgrade path**: Ensure `git pull` on platform doesn't conflict with custom code
- [ ] **Apache 2.0 license**: Fully open source template

### Massivoto Branding & Trademark

- [ ] **Trademark policy**: Define rules for using "Massivoto" name
- [ ] **Logo usage guidelines**: When/how others can use Massivoto branding
- [ ] **Naming conventions**: What custom builds can/cannot be called
- [ ] **Attribution requirements**: Required notices for forks and derivatives

---

## v1.0 - Production SaaS

Paying customers require reliability, security, and easy deployment.

### CLI Tool (`@massivoto/oto`)

A standalone CLI to run OTO programs from the terminal.

- [ ] **Create `@massivoto/oto` package**: new package in `packages/oto`
- [ ] **Global install support**: `npm install -g @massivoto/oto` installs `oto` command
- [ ] **npx support**: `npx @massivoto/oto` runs without install
- [ ] **Default file discovery**: `oto` looks for `oto.md` in current directory
- [ ] **Custom file flag**: `oto -f my-workflow.oto.md` runs specified file
- [ ] **Exit codes**: 0 on success, non-zero on failure (for CI/CD integration)
- [ ] **Output formatting**: structured output for human and machine consumption

## Quality

Track test coverage and set it at 100% for runtime and non UI components.


### Error Handling

This is a major topic that needs a dedicated PRD. For now, we list the main
points when we will explore 0.5.

### Identifier Semantics

There are two distinct uses of identifiers that share the same AST type but have
different runtime semantics:

| Use                  | Example         | Semantics                          | Current Type     |
|----------------------|-----------------|------------------------------------|------------------|
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

### Evaluator Enhancements

- [ ] **Equality for objects**: define `==` semantics for non-literal values (deep equality vs reference)
- [ ] **Equality for mixed types**: define `==` behavior when comparing different types (e.g., `1 == "1"`)

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

### Cloud Applet Launcher

For v1.0, applets run in Docker containers on AWS instead of localhost.

- [ ] **Docker packaging infrastructure**: base Dockerfile template, compose support, health checks (see `applet-docker.wip.prd.md`) - FOUNDATION COMPLETE
  - [x] AppletDockerConfig interface defined
  - [x] Dockerfile generator function with node:22-alpine base
  - [x] docker-compose.yml generator with env var support
  - [x] Health check middleware returning status, applet ID, uptime
  - [x] Entry point script with SIGTERM graceful shutdown
  - [x] Per-applet Docker support in confirm applet (reference implementation)
- [ ] **CloudAppletLauncher**: implements AppletLauncher interface for AWS ECS
- [ ] **ECS task spawning**: launch container per applet instance
- [ ] **Proxy routing**: route user requests to correct container by session ID
- [ ] **Auto-termination**: container cleanup after response or timeout
- [ ] **Cost tracking**: hourly billing per running applet container

### Production Hardening

- [ ] **Rate limiting**: protect against abuse
- [ ] **Execution timeouts**: prevent runaway scripts
- [ ] **Cost limits**: hard caps per user/execution
- [ ] **Audit logging**: compliance-ready execution history
- [ ] **CRITICAL - Applet crash recovery**: If the runner process crashes,
  applets must be terminated and billing stopped. Cannot wait for timeout
  (48h) to stop invoicing. Requires:
    - Heartbeat mechanism between runner and applet containers
    - External watchdog to detect runner death
    - Automatic applet termination on runner crash
    - Billing stops immediately on crash detection

---

# 1.2 growth

create a mobile app so that someone in the team can validate human applets from his mobile phone.




## v1.5 - Developer Experience

Focus on adoption and usability, no new runtime features.



### Parser Enhancements

- [ ] **Chained unary operators**: support `!!flag`, `!-10` etc. (see
  `unary-parser.spec.ts` skipped tests)

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

### Local Runner

- [ ] **REPL mode**: interactive execution for debugging

### Syntax Strictness

- [x] **No spaces around `=`**: `key=value` only, reject `key = value` and
  `key= value`


---

## Terminology

| Term                 | Layer          | Definition                                                 |
|----------------------|----------------|------------------------------------------------------------|
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

1. ~~**Goto/Label semantics**: How do labels interact with blocks and loops?~~
   **Resolved:** See `goto-label.prd.md` - labels on any command, goto restarts loops/re-evaluates conditions
2. **Validation app**: Separate service or embedded in runner?
3. **Type system depth**: How strict should pipe type checking be in v1.0?
4. **ProviderDriver naming**: Is "Driver" the right term? Alternatives:
   ProviderAdapter, ProviderHandler, AuthProvider?
5. ~~**Terminology cleanup**: When to rename `InstructionNode` → `ActionNode`? (breaking change)~~
   **Resolved:** Parser is a closed module. Keep internal types as-is. Only rename `InstructionLog` → `ActionLog` to align public API with marketing terms. See [terminology-refactor.wip.prd.md](packages/runtime/src/terminology-refactor.wip.prd.md)
