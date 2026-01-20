# PRD: DSL 0.5 Parser

**Status:** IMPLEMENTED
**Last updated:** 2026-01-16

> - DRAFT: Coding should not start, requirements being defined
> - APPROVED: Code can start, requirements stable
> - IMPLEMENTED: Tests passing, feature complete
> - ITERATING: Modifying existing code, PRD being updated

## Progress

| Section | Status | Progress |
|---------|--------|----------|
| Context | ✅ Complete | 100% |
| Scope | ✅ Complete | 100% |
| Requirements: Command Parser | ✅ Complete | 5/5 |
| Requirements: Argument Parser | ✅ Complete | 4/4 |
| Requirements: Literals | ✅ Complete | 4/4 |
| Requirements: Identifiers | ✅ Complete | 2/2 |
| Requirements: Member Expressions | ✅ Complete | 3/3 |
| Requirements: Unary Expressions | ✅ Complete | 2/2 |
| Requirements: Binary Expressions | ✅ Complete | 4/4 |
| Requirements: Logical Expressions | ✅ Complete | 3/3 |
| Requirements: Pipe Expressions | ✅ Complete | 6/6 |
| Requirements: Operator Precedence | ✅ Complete | 2/2 |
| Requirements: Instruction Assembly | ✅ Complete | 3/3 |
| Acceptance Criteria | ✅ Complete | 7/8 |
| **Overall** | **IMPLEMENTED** | **100%** |

## Parent PRD

- [runtime.archi.md](../../../../runtime.archi.md)

## Child PRDs

- None

## Context

DSL 0.5 is the first complete version of the Massivoto Automation Programming Language parser. The core design principle is **NO AMBIGUITY** - every construct has exactly one interpretation. This makes the language suitable for AI-generated code where predictable parsing is essential.

The parser transforms DSL source text into an Abstract Syntax Tree (AST) that can be normalized, evaluated, and executed by downstream compiler stages. It uses the `@masala/parser` library for parser combinators.

## Decision Log

| Date | Option | Decision | Rationale |
|------|--------|----------|-----------|
| 2026-01-16 | Parser library | @masala/parser | Type-safe combinators, good error messages |
| 2026-01-16 | Pipe syntax | `{input\|pipe:arg}` with braces | Unambiguous delimiter, avoids shell conflicts |
| 2026-01-16 | Member access | Dot notation only | Simpler parsing, no computed `obj[expr]` |
| 2026-01-16 | String quotes | Double quotes only | Single interpretation, defer single quotes |
| 2026-01-16 | Null literal | **No `null` in DSL** | Simplicity - handle null at runtime/evaluator level; external nulls (APIs, DBs) treated as falsy |

## Scope

**In scope:**
- Command parsing: `@package/function` syntax
- Argument parsing: `key=value` pairs
- Literal expressions: strings, numbers, booleans (no null - handled at runtime)
- Identifier expressions with reserved word filtering
- Member expressions: `user.name.email`
- Unary expressions: `!`, `-`, `+`
- Binary expressions: `+`, `-`, `*`, `/`, `%`
- Comparison expressions: `==`, `!=`, `<`, `<=`, `>`, `>=`
- Logical expressions: `&&`, `||`
- Pipe expressions: `{data|filter:arg|map:fn}`
- Parenthesized expressions for grouping
- Output argument special handling
- Full operator precedence implementation

**Out of scope:**
- Comments (`//`, `/* */`)
- Control flow (`if`, `forEach`, `while`)
- Block syntax (`@begin`, `@end`)
- Templates (`#package/template`)
- String interpolation (`${}`)
- Single-quoted strings
- Computed properties (`obj[expr]`)
- Conditional expressions (`a ? b : c`)
- Multiline commands
- Empty argument shorthand (`flag` meaning `flag=true`)

**Next Moves**
- output improvements
- single string acceptation
- define what is a typing (number, string, boolean, mapping, array)
- define mapping parser as first class type


## Requirements

### Command Parser

**Last updated:** 2026-01-16
**Test:** `npx vitest run packages/runtime/src/compiler/parser/command`
**Progress:** 5/5 (100%)

- ✅ R-CMD-01: Commands start with `@` followed by package name
- ✅ R-CMD-02: Package and function separated by `/` with minimum one segment (`@pkg/cmd`)
- ✅ R-CMD-03: Subcommands supported via additional `/` segments (`@pkg/sub/cmd`)
- ✅ R-CMD-04: No spaces allowed inside commands - parser rejects `@pkg/ name`, `@ pkg/name`
- ✅ R-CMD-05: CommandNode contains `package`, `name` (last segment), and `path` (all segments)

### Argument Parser

**Last updated:** 2026-01-16
**Test:** `npx vitest run packages/runtime/src/compiler/parser/arg-parser.spec.ts`
**Progress:** 4/4 (100%)

- ✅ R-ARG-01: Arguments use `key=value` syntax where key is an identifier
- ✅ R-ARG-02: Value is any valid expression (literal, identifier, member, binary, pipe, etc.)
- ✅ R-ARG-03: `output` is a special argument - its value must be an identifier (not expression)
- ✅ R-ARG-04: Multiple arguments separated by whitespace

### Literals

**Last updated:** 2026-01-16
**Test:** `npx vitest run packages/runtime/src/compiler/parser/args-details/tokens/literals-parser.spec.ts`
**Progress:** 3/4 (75%)

- ✅ R-LIT-01: String literals use double quotes: `"hello world"` → `LiteralStringNode`
- ✅ R-LIT-02: Number literals include integers and decimals: `42`, `3.14`, `-5` → `LiteralNumberNode`
- ✅ R-LIT-03: Boolean literals: `true`, `false` → `LiteralBooleanNode`
- ✅ R-LIT-04: String escape sequences: `\"`, `\\`, `\n`, `\t` are supported

> **Note:** `null` is intentionally not a DSL literal. External null values (APIs, databases) are handled at the evaluator/runtime level as falsy values.

### Identifiers

**Last updated:** 2026-01-16
**Test:** `npx vitest run packages/runtime/src/compiler/parser/args-details`
**Progress:** 2/2 (100%)

- ✅ R-ID-01: Identifiers match pattern `[a-zA-Z_][a-zA-Z0-9_-]*` and cannot end with `-`
- ✅ R-ID-02: Reserved words cannot be identifiers (list includes control flow: `for`, `forEach`, `for-each`, `if`, `else`, `endif`, `while`, `repeat`, `switch`, `case`, `default`, `break`, `continue`, `return`, `function`, `let`, `const`, `var`)

### Member Expressions

**Last updated:** 2026-01-16
**Test:** `npx vitest run packages/runtime/src/compiler/parser/args-details/unary-parser/member-parser.spec.ts`
**Progress:** 3/3 (100%)

- ✅ R-MEM-01: Member expressions use dot notation: `user.name` → `MemberExpressionNode`
- ✅ R-MEM-02: Nested paths supported: `data.users.0.email` with path array `["users", "0", "email"]`
- ✅ R-MEM-03: No computed property access (`obj[expr]`) - dot notation only

### Unary Expressions

**Last updated:** 2026-01-16
**Test:** `npx vitest run packages/runtime/src/compiler/parser/args-details/unary-parser/unary-parser.spec.ts`
**Progress:** 2/2 (100%)

- ✅ R-UN-01: Logical NOT: `!isValid` → `UnaryExpressionNode` with operator `!`
- ✅ R-UN-02: Numeric negation/affirmation: `-count`, `+value` → `UnaryExpressionNode`

### Binary Expressions

**Last updated:** 2026-01-16
**Test:** `npx vitest run packages/runtime/src/compiler/parser/args-details/binary-operation`
**Progress:** 4/4 (100%)

- ✅ R-BIN-01: Arithmetic operators: `+`, `-`, `*`, `/`, `%` → `BinaryExpressionNode`
- ✅ R-BIN-02: Comparison operators: `<`, `<=`, `>`, `>=` → `BinaryExpressionNode`
- ✅ R-BIN-03: Equality operators: `==`, `!=` → `BinaryExpressionNode`
- ✅ R-BIN-04: Binary expressions are left-associative: `a - b - c` → `((a - b) - c)`

### Logical Expressions

**Last updated:** 2026-01-16
**Test:** `npx vitest run packages/runtime/src/compiler/parser/args-details/binary-operation/logical-parser.spec.ts`
**Progress:** 3/3 (100%)

- ✅ R-LOG-01: Logical AND: `a && b` → `LogicalExpressionNode` with operator `&&`
- ✅ R-LOG-02: Logical OR: `a || b` → `LogicalExpressionNode` with operator `||`
- ✅ R-LOG-03: Logical expressions are left-associative

### Pipe Expressions

**Last updated:** 2026-01-16
**Test:** `npx vitest run packages/runtime/src/compiler/parser/args-details/pipe-parser`
**Progress:** 6/6 (100%)

- ✅ R-PIPE-01: Pipe expressions wrapped in braces: `{input|pipe}` → `PipeExpressionNode`
- ✅ R-PIPE-02: Pipe segments use `|` separator: `{data|filter|map}`
- ✅ R-PIPE-03: Pipe arguments use `:` separator: `{users|orderBy:followers|tail:10}`
- ✅ R-PIPE-04: Pipe input is a simple expression (not another pipe)
- ✅ R-PIPE-05: Pipes chain left-to-right, each segment has `pipeName` and `args` array
- ✅ R-PIPE-06: Pipes can have multiple arguments: `{users|orderBy:followers:20}`

### Operator Precedence

**Last updated:** 2026-01-16
**Test:** `npx vitest run packages/runtime/src/compiler/parser/args-details`
**Progress:** 2/2 (100%)

- ✅ R-PREC-01: Precedence from highest to lowest: primary → member → unary → multiplicative → additive → comparison → equality → logical AND → logical OR → pipe
- ✅ R-PREC-02: Parentheses override precedence: `(a + b) * c` groups addition first

### Instruction Assembly

**Last updated:** 2026-01-16
**Test:** `npx vitest run packages/runtime/src/compiler/parser/instruction-parser.spec.ts`
**Progress:** 3/3 (100%)

- ✅ R-INST-01: InstructionNode combines command, args array, and optional output
- ✅ R-INST-02: Output argument extracted from args and stored separately on InstructionNode
- ✅ R-INST-03: Parser uses GenLex for tokenization with command as high-priority token

## Dependencies

- **Depends on:** @masala/parser library
- **Blocks:** Normalizer (forEach, if expansion), Evaluator, Interpreter

## Open Questions

- [x] ~~Should single-quoted strings be supported?~~ Deferred to 0.6
- [x] ~~Should empty shorthand (`flag` = `flag=true`) be supported?~~ Deferred to 0.6
- [x] ~~Support computed properties `obj[expr]`?~~ No, dot notation only for 0.5

## Acceptance Criteria

### Theme

> **Theme:** Social Media Automation
>
> Test scenarios use Twitter/social media commands for consistency and relatability.
> New theme for this feature.

### Criteria

- [x] AC-DSL05-01: Given developer writes `@twitter/post message="Hello"`, when parsed, then InstructionNode has command `{package: "twitter", name: "post"}` and one argument
- [x] AC-DSL05-02: Given developer writes `@twitter/users ids={tweets|mappedBy:id} output=users`, when parsed, then output is extracted as `IdentifierNode` and pipe expression is in args
- [x] AC-DSL05-03: ~~`count=followers * 2 + 100`~~ **WON'T FIX** - Binary expressions require braces: `count={followers * 2 + 100}`. See [expression-boundaries.prd.md](./expression-boundaries.prd.md)
- [x] AC-DSL05-04: ~~`active=isVerified && hasEmail`~~ **WON'T FIX** - Logical expressions require braces: `active={isVerified && hasEmail}`. See [expression-boundaries.prd.md](./expression-boundaries.prd.md)
- [x] AC-DSL05-05: Given developer writes `@filter/users match=!isBlocked`, when parsed, then unary NOT expression wraps identifier
- [x] AC-DSL05-06: Given developer writes `@db/query limit=users.settings.pageSize`, when parsed, then member expression has path `["settings", "pageSize"]`
- [x] AC-DSL05-07: Given developer writes `@twitter/ post` with space in command, when parsed, then parser rejects with error
- [x] AC-DSL05-08: Given developer writes `@utils/set value=if`, when parsed, then parser rejects because `if` is a reserved word
- [x] All automated tests pass (83/83, 2 skipped)
- [ ] Edge cases covered in separate `*.edge.spec.ts` files
