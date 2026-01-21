# Build

Build packages and applications in the monorepo.

## Commands

- `yarn build` - Build all packages (TypeScript)
- `yarn build:kit` - Build @massivoto/kit
- `yarn build:runtime` - Build @massivoto/runtime
- `yarn workspace @massivoto/auth-domain build` - Build auth-domain

## Process

1. Identify which package(s) need building
2. Build dependencies first (auth-domain before auth-backend)
3. Run the appropriate build command
4. Report any TypeScript errors clearly with file:line references
