# Massivoto Platform

Monorepo for the Massivoto automation platform.

## Structure

- `apps/` - Frontend applications (React, Vite)
- `packages/` - Shared libraries (@massivoto/kit, @massivoto/auth-domain)
- `services/` - Backend services (Express, Node.js)

## Tech Stack

- TypeScript (strict mode)
- Yarn workspaces
- Vite for frontend builds
- ESM modules throughout

## Conventions

### Code Style
- No emojis in code or commits
- Prefer editing existing files over creating new ones
- Keep solutions simple - avoid over-engineering

### Git Commits
- Format: `type(scope): description`
- Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`
- Scope: the domain or package affected (e.g., `auth-domain`, `auth`, `auth-backend`)
- Description: imperative mood, lowercase, no period
- Examples:
  - `feat(auth-domain): add token refresh logic`
  - `fix(auth): handle expired token redirect`
  - `chore(deps): update zod to v3.24`

### Packages
- Shared code goes in `packages/`
- Use `@massivoto/` npm scope
- Single entry point exports (no subpath exports complexity)

### Testing
- Test framework: vitest
- Tests are colocated with source files: `xyz.spec.ts` next to `xyz.ts`
- Never create `__tests__` directories

## Key Packages

- `@massivoto/auth-domain` - Shared auth types, OAuth utilities, PKCE, token management
- `@massivoto/kit` - Common utilities, logging, errors

## Commands

```bash
yarn install          # Install all dependencies
yarn build            # Build all packages
yarn test             # Run all tests
npx vitest run <path> # Run specific test file
yarn clean:claude     # Remove Claude temp files
```
