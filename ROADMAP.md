# Massivoto APL Roadmap

## Version Strategy

| Version | Goal | Target |
|---------|------|--------|
| **0.5** | Local execution for product discovery | Personal use |
| **1.0** | Production SaaS | Paying customers |
| **1.5** | Developer experience & adoption | Growth |

---

## v0.5 - Local Execution

The goal is to have a working local runner to validate the product concept.

### Reserved Arguments & Output

Current state: `output`, `if`, `forEach` are treated as regular arguments with post-processing hacks.
One problem is that an identifier can't be a reserved word, of if can't be an argument name.
(in shared-parser:)

```ts
export const identifier = F.regex(/[a-zA-Z_][a-zA-Z0-9_-]*/)
.filter((s) => s.charAt(s.length - 1) !== '-')
.filter((s) => !reservedWords.includes(s))
```

- [ ] **Reserved argument system**: define `reservedArg` with priority over regular args
- [ ] **Native output handling**: `output` should not go through standard arg parsing
- [ ] **Clean normalizer**: remove dirty tricks for `if` detection; use proper reserved word handling

### Parser Enhancements

- [ ] **Block parsing**: `{ ... }` statement groups
- [ ] **If statement**: `@if condition { ... }`
- [ ] **ForEach statement**: `@forEach item of items { ... }`
- [ ] **Goto/Label**: control flow jumps for complex workflows
- [ ] **Unary operators**: 2 skipped tests in `unary-parser.spec.ts` need investigation



### Evaluator

- [ ] **Complete node coverage**: handle all AST node types (binary, unary, logical, member, array, pipe)
- [ ] **Block evaluation**: evaluate `BlockNode` sequences
- [ ] **Pipe evaluation**: execute pipe chains with data transformation

### Mapping & Transformation

- [ ] **Mapper pipe**: `$data | map transform="..."`
- [ ] **ForEach mapping**: iterate and transform collections

### Action Resolution System

**Action** (product) → **ActionResolver** (binding) → **Command** (technical).

#### ActionResolver

The resolver maps an Action to one or more Commands based on arguments.

Example: `@ai/generate model="gemini"` resolves to `GeminiCommand`, while `model="sonnet"` resolves to `SonnetCommand`.

- [ ] **ActionResolver implementation**: resolve Action + args → Command(s)
- [ ] **Argument-based routing**: different handlers based on arg values
- [ ] **Command bundles**: package related commands together

#### CredentialVault

Commands requiring authentication need credential injection from the vault.

- [ ] **CredentialVault interface**: define how commands request credentials
- [ ] **Integration with auth-domain**: use existing OAuth token storage
- [ ] **Credential types**: OAuth tokens, API keys, connection strings

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

### Human Validation Checkpoints

Between commands, deploy a mini web app for human input.

- [ ] **Validation app generator**: create temporary UI for user decisions
- [ ] **URL-based access**: shareable link to validation page
- [ ] **Array selection**: user picks values from lists
- [ ] **Continuation**: process resumes after user confirms

---

## v1.0 - Production SaaS

Paying customers require reliability, security, and easy deployment.

### Parser Type System

- [ ] **Pipe type checking**: reject invalid pipe chains (e.g., mapper expects array, gets number)
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

| Term | Layer | Definition |
|------|-------|------------|
| **OTO** | Language | The DSL language (files: `.oto`) |
| **Action** | Product | What the user writes: `@package/name args...` |
| **Command** | Technical | TypeScript class that executes an action |
| **ActionResolver** | Binding | Maps Action + args → Command(s) |
| **CommandRegistry** | Storage | Stores available Command implementations |
| **CredentialVault** | Infrastructure | Provides OAuth tokens/API keys to commands |
| **Runner** | Infrastructure | Execution environment (Local, SaaS, On-Premise) |
| **Store** | Infrastructure | State persistence backend (file, S3, database) |

---

## Open Questions

1. **Goto/Label semantics**: How do labels interact with blocks and loops?
2. **Validation app**: Separate service or embedded in runner?
3. **Type system depth**: How strict should pipe type checking be in v1.0?
