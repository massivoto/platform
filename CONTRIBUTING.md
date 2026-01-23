# Contributing to Massivoto

Thank you for your interest in contributing to Massivoto.

## License

By contributing to this repository, you agree that your contributions will be licensed under the **Apache License 2.0**.

### Current Licensing

All code in this repository is currently licensed under Apache 2.0.

### Future Licensing (Planned)

When the project matures, we plan to adopt a hybrid licensing model:

| Component | License | CLA Required |
|-----------|---------|--------------|
| `packages/runtime` | BSL 1.1 | Yes |
| Everything else | Apache 2.0 | No |

When this change occurs:
- Contributions to `packages/runtime` will require signing a Contributor License Agreement (CLA)
- Contributions to all other packages remain under Apache 2.0 with no CLA

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/platform.git`
3. Install dependencies: `yarn install`
4. Create a branch: `git checkout -b feat/your-feature`
5. Make your changes
6. Run tests: `yarn test`
7. Commit using conventional commits (see below)
8. Push and create a Pull Request

## Development

```bash
yarn install          # Install dependencies
yarn build            # Build all packages
yarn test             # Run all tests
yarn type-check       # TypeScript validation
```

## Commit Convention

We use conventional commits:

```
type(scope): description
```

**Types:** `feat`, `fix`, `chore`, `refactor`, `docs`, `test`

**Scope:** the package or domain affected (e.g., `runtime`, `auth-domain`, `kit`)

**Examples:**
- `feat(runtime): add foreach loop support`
- `fix(auth-domain): handle expired token refresh`
- `docs(readme): update installation instructions`
- `test(kit): add logger unit tests`

## Code Style

- TypeScript strict mode
- No emojis in code or commits
- Tests colocated with source: `foo.spec.ts` next to `foo.ts`
- ESM modules throughout
- Prefer editing existing files over creating new ones

## Testing

- Test framework: Vitest
- Run specific test: `npx vitest run path/to/file.spec.ts`
- Tests must pass before PR merge

## Questions?

Open an issue for questions about contributing.
