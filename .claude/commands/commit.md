# Commit

Create a git commit for staged or all changes.

## Rules

1. NEVER add "Co-Authored-By" or any mention of Claude/AI in commits
2. NEVER add emojis to commit messages
3. Use this exact format: `type(scope): description`

## Commit Format

```
type(scope): short description in imperative mood
```

### Types
- `feat` - New feature
- `fix` - Bug fix
- `chore` - Maintenance, dependencies, tooling
- `refactor` - Code restructuring without behavior change
- `docs` - Documentation only
- `test` - Adding or updating tests

### Scope
The domain or package affected:
- `auth-domain`, `auth`, `auth-backend`
- `kit`, `engine`, `runtime`
- `deps` for dependency updates
- `housekeeping` for cleanup tasks

### Description
- Imperative mood ("add", "fix", "update" not "added", "fixed", "updated")
- Lowercase
- No period at end
- Be specific but concise

## Process

1. Run `git status` to see changes
2. Run `git diff --staged` or `git diff` to understand what changed
3. Group related changes logically
4. Write commit message following the format above
5. Commit without any AI attribution

## Examples

Good:
```
feat(auth-domain): add token refresh logic
fix(auth): handle expired token redirect
chore(deps): update zod to v3.24
refactor(auth-backend): extract provider factory
```

Bad:
```
Fixed the bug          # no type/scope, past tense
feat: stuff            # vague, no scope
FEAT(Auth): Add Things # wrong case
```
