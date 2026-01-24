# PRD: Action Naming Refactor

**Status:** IMPLEMENTED
**Last updated:** 2026-01-17

> - DRAFT: Coding should not start, requirements being defined
> - APPROVED: Code can start, requirements stable
> - IMPLEMENTED: Tests passing, feature complete
> - ITERATING: Modifying existing code, PRD being updated

## Progress

| Section | Status | Progress |
|---------|--------|----------|
| Context | ✅ Complete | 100% |
| Scope | ✅ Complete | 100% |
| Requirements: AST Types | ✅ Complete | 3/3 |
| Requirements: Parser Files | ✅ Complete | 5/5 |
| Requirements: Parser References | ✅ Complete | 4/4 |
| Requirements: PRD Updates | ✅ Complete | 3/3 |
| Acceptance Criteria | ✅ Complete | 2/2 |
| **Overall** | **IMPLEMENTED** | **100%** |

## Parent PRD

- [ROADMAP.md](../../../../../ROADMAP.md) - Foundation: Domain Naming

## Context

The Massivoto platform distinguishes between two layers:

- **Product Layer (Action)**: What the user writes in OTO source code (`@ai/generate model="gemini"`)
- **Technical Layer (Command)**: TypeScript handlers that execute actions (`GeminiHandler`)

Currently, the parser uses "Command" terminology (`CommandNode`, `command-parser.ts`) which belongs to the technical layer. This creates confusion because the parser deals with the product layer.

This refactor applies consistent naming:
- Parser directory uses **Action** terminology
- Handlers directory keeps **Command** terminology

## Decision Log

| Date | Option | Decision | Rationale |
|------|--------|----------|-----------|
| 2026-01-17 | ActionNode vs ActionIdentifier vs ActionPath | **ActionNode** | Node suffix is consistent with AST; "Action" is the product term for `@pkg/name` |
| 2026-01-17 | Rename InstructionNode? | **Keep InstructionNode** | Instruction = Action + args; Program = set of Instructions. Clear hierarchy. |

## Scope

**In scope:**
- Rename `CommandNode` → `ActionNode` in AST
- Rename `InstructionNode.command` → `InstructionNode.action`
- Rename `command/` directory → `action/`
- Rename all files: `command-*.ts` → `action-*.ts`
- Update all imports and references in parser directory
- Update existing PRDs in parser directory

**Out of scope:**
- `CommandHandler` (handlers layer - correct term)
- `CommandRegistry` (handlers layer - correct term)
- Files outside `packages/runtime/src/interpreter/parser/`
- Interpreter references to command (uses handler layer)

## Requirements

### AST Types

**Last updated:** 2026-01-17
**Test:** `npx vitest run packages/runtime/src/interpreter/parser`
**Progress:** 3/3 (100%)

- ✅ R-NAME-01: Rename `CommandNode` interface to `ActionNode` in `ast.ts`
- ✅ R-NAME-02: Rename `InstructionNode.command` field to `InstructionNode.action`
- ✅ R-NAME-03: Update `DslAstNode` union type to use `ActionNode` instead of `CommandNode`

### Parser Files

**Last updated:** 2026-01-17
**Test:** `npx vitest run packages/runtime/src/interpreter/parser`
**Progress:** 5/5 (100%)

- ✅ R-NAME-21: Rename directory `command/` → `action/`
- ✅ R-NAME-22: Rename `command-parser.ts` → `action-parser.ts`
- ✅ R-NAME-23: Rename `command-parser.spec.ts` → `action-parser.spec.ts`
- ✅ R-NAME-24: Rename `command-tokens.ts` → `action-tokens.ts`
- ✅ R-NAME-25: Rename function `buildCommandParser()` → `buildActionParser()`

### Parser References

**Last updated:** 2026-01-17
**Test:** `npx vitest run packages/runtime/src/interpreter/parser`
**Progress:** 4/4 (100%)

- ✅ R-NAME-41: Update `instruction-parser.ts` imports and references
- ✅ R-NAME-42: Update `InstructionTokens.COMMAND` → `InstructionTokens.ACTION`
- ✅ R-NAME-43: Update all `CommandNode` type references to `ActionNode`
- ✅ R-NAME-44: Update all `.command` property accesses to `.action`

### PRD Updates

**Last updated:** 2026-01-17
**Progress:** 3/3 (100%)

- ✅ R-NAME-61: Update `dsl-0.5-parser.prd.md` terminology (Command → Action)
- ✅ R-NAME-62: Update `command-parser-refactor.prd.md` → rename file to `action-parser-refactor.prd.md`
- ✅ R-NAME-63: Update any other PRD references to CommandNode/command-parser

## Dependencies

- **Depends on:** None
- **Blocks:** Further parser development should use new terminology

## Open Questions

- [x] Should InstructionNode be renamed? → No, keep it. Instruction = Action + args.
- [x] Should interpreter references be updated? → Out of scope for this PRD (different layer)

## Acceptance Criteria

### Theme

> **Theme:** Parser Terminology
>
> Test scenarios verify correct naming in code and types.

### Criteria

- [x] AC-NAME-01: The word "Command" does not appear in any `.ts` file within `packages/runtime/src/interpreter/parser/` (except in comments explaining the Action/Command distinction)
- [x] AC-NAME-02: All existing parser tests pass after renaming (no functional changes)
