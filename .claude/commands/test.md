# Test

Run tests using vitest for packages in the monorepo.

## Usage

- `/test` - Run all tests
- `/test <path>` - Run specific test file or directory

## Arguments

$ARGUMENTS - Optional path to a specific test file or directory (e.g., `packages/auth-domain/src/mock/mock-token.spec.ts`)

## Test File Convention

Tests are colocated with source files:
- `xyz.ts` -> `xyz.spec.ts`
- `xyz.tsx` -> `xyz.spec.tsx`

Never create a separate `__tests__` directory. Keep tests next to the code they test.

## Process

1. If `$ARGUMENTS` is provided:
   - Run `npx vitest run $ARGUMENTS`
2. If no arguments:
   - Run `yarn test` to run all tests
3. If tests fail, analyze the output and fix the issues
4. Re-run tests to confirm fixes
5. Report results clearly with pass/fail counts

## Writing Tests

When creating new tests:
1. Create `xyz.spec.ts` next to `xyz.ts`
2. Use vitest imports: `import { describe, it, expect } from 'vitest'`
3. Follow existing test patterns in the codebase
4. Keep tests focused and descriptive
