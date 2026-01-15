# PRD: Command Parser Dual GenLex Refactor

**Status:** IMPLEMENTED
**Last updated:** 2026-01-15

> - DRAFT: Coding should not start, requirements being defined
> - APPROVED: Code can start, requirements stable
> - IMPLEMENTED: Tests passing, feature complete
> - ITERATING: Modifying existing code, PRD being updated

## Progress

| Section | Status | Progress |
|---------|--------|----------|
| Context | ✅ Complete | 100% |
| Scope | ✅ Complete | 100% |
| Requirements: Command Parser | ✅ Complete | 4/4 |
| Requirements: Instruction Integration | ✅ Complete | 4/4 |
| Requirements: Tests | ✅ Complete | 3/3 |
| Acceptance Criteria | ✅ Complete | 4/4 |
| **Overall** | **IMPLEMENTED** | **100%** |

## Parent PRD

- None (runtime package)

## Child PRDs

- None

## Context

The current command parser uses the same GenLex instance as the instruction parser. GenLex's default behavior treats whitespace as a separator between tokens, which means `@tweeter/ users` incorrectly parses as a valid command - the space between `/` and `users` is silently ignored.

Commands must be contiguous strings with no internal whitespace. The fix is to use a dedicated GenLex for command parsing with separators disabled, then register the entire command as a single token in the instruction GenLex.

This bug is already documented in `command-parser.spec.ts` with a TODO comment and a disabled test case.

## Decision Log

| Date | Option | Decision | Rationale |
|------|--------|----------|-----------|
| 2026-01-15 | A: Dual GenLex vs B: Custom separator vs C: Character-level | **C selected** | GenLex with `F.returns('')` separator causes infinite loop; character-level parsing is cleanest |
| 2026-01-15 | Minimum segments | At least 1 required | `@pkg/cmd` is minimum, `@pkg` alone is invalid |
| 2026-01-15 | Special forms | None | No `@@reserved` or other special syntax |

## Scope

**In scope:**
- Create command parser using character-level combinators (no GenLex)
- Register command as a single `COMMAND` token in instruction GenLex
- Update `InstructionTokens` to use `COMMAND` instead of extending `CommandTokens`
- Validate minimum one segment (`@pkg/cmd`)
- Enable the disabled test in `command-parser.spec.ts`

**Out of scope:**
- Changes to argument parsing
- Changes to expression parsing
- New command syntax or special forms

## Requirements

### Command Parser

**Last updated:** 2026-01-15
**Test:** `npx vitest run packages/runtime/src/compiler/parser/command`
**Progress:** 4/4 (100%)

- ✅ R-CMDPARSE-01: Create `buildCommandParser()` function that returns `SingleParser<CommandNode>` using character-level combinators
- ✅ R-CMDPARSE-02: Command parser uses no GenLex - pure character parsing naturally rejects whitespace
- ✅ R-CMDPARSE-03: Command grammar requires at least one segment: `@package/function` minimum (`.rep()` not `.optrep()`)
- ✅ R-CMDPARSE-04: Command parser rejects input with internal spaces: `@pkg/ name`, `@ pkg/name`, `@pkg /name` all fail

### Instruction Integration

**Last updated:** 2026-01-15
**Test:** `npx vitest run packages/runtime/src/compiler/parser/instruction-parser.spec.ts`
**Progress:** 4/4 (100%)

- ✅ R-CMDPARSE-21: Removed `CommandTokens` from `InstructionTokens` interface (no longer extends)
- ✅ R-CMDPARSE-22: Added `COMMAND: SingleParser<CommandNode>` to `InstructionTokens` interface
- ✅ R-CMDPARSE-23: Register command parser as token via `genlex.tokenize(buildCommandParser(), 'COMMAND', 3000).map(leanToken)`
- ✅ R-CMDPARSE-24: Updated `createInstructionGrammar()` to use `tokens.COMMAND` directly

### Tests

**Last updated:** 2026-01-15
**Test:** `npx vitest run packages/runtime/src/compiler/parser`
**Progress:** 3/3 (100%)

- ✅ R-CMDPARSE-41: Enabled and rewrote test in `command-parser.spec.ts` that verifies `@package/ name` is rejected
- ✅ R-CMDPARSE-42: Added test case for `@ package/name` (space after @) - rejects
- ✅ R-CMDPARSE-43: Added test case for `@pkg /name` (space before /) - rejects

## Dependencies

- **Depends on:** @masala/parser (character combinators, GenLex for instruction tokenization)
- **Blocks:** None (isolated refactor)

## Open Questions

- [x] ~~Should `@package` without segments be valid?~~ No, require at least `@pkg/cmd`
- [x] ~~Support special forms like `@@reserved`?~~ No

## Acceptance Criteria

### Theme

> **Theme:** Social Media Automation
>
> Test scenarios use Twitter/social media commands for consistency with existing parser tests.
> New theme for this feature.

### Criteria

- [x] AC-CMDPARSE-01: Given developer writes `@twitter/post message="Hello"`, when parsed, then command is `{package: 'twitter', name: 'post', path: ['twitter', 'post']}`
- [x] AC-CMDPARSE-02: Given developer writes `@twitter/ post` with space inside command, when parsed, then parser rejects with error
- [x] AC-CMDPARSE-03: Given developer writes `@twitter/analytics/daily`, when parsed, then command has 3-segment path `['twitter', 'analytics', 'daily']`
- [x] AC-CMDPARSE-04: All existing instruction parser tests pass without modification
- [x] All automated tests pass (78 parser tests)
- [x] Edge cases covered in `command-parser.spec.ts` describe block
