# File Path Literals in OTO

This document explains how to use file paths and glob patterns in the OTO DSL.
It is intended for LLMs generating OTO programs from user prompts.

## Quick Reference

| What you write | AST node type | When to use |
|----------------|---------------|-------------|
| `~/images/hero.png` | `literal-file` | Reference a single known file |
| `~/images/*.jpg` | `literal-glob` | Match multiple files by pattern |

Both are **expression literals**, usable anywhere a value is expected: bare arguments, braced expressions, arrays, forEach sources.

## Syntax Rules

### Mandatory `~/` prefix

Every file path starts with `~/`. There is no other accepted prefix.

```oto
// Correct
@ai/describe image=~/images/hero.png

// Wrong - will NOT parse as file literals
@ai/describe image=images/hero.png
@ai/describe image=./images/hero.png
@ai/describe image=/etc/passwd
```

### Allowed characters

Only Latin characters: `a-zA-Z0-9`, `-`, `_`, `.`, `/`, and `*` (glob only).

No spaces, no unicode, no quotes, no special characters.

### Path traversal is forbidden

`..` anywhere in the path is rejected at parse time. This is a security constraint.

```oto
// Rejected by parser
@utils/load file=~/images/../secrets/key.pem
```

### Trailing slash means directory

A trailing `/` is accepted and normalized (stripped from the stored value).

```oto
@utils/load dir=~/images/
// AST value: "~/images" (trailing slash removed)
```

### The `~/` prefix is kept in the AST

The parser stores the full path including `~/`. Stripping or resolving it is the evaluator's or command's responsibility.

```oto
@ai/describe image=~/images/hero.png
// AST: { type: 'literal-file', value: '~/images/hero.png' }
```

## File Literal (`literal-file`)

Use when you know the exact file path. No wildcards allowed.

```oto
@ai/describe image=~/images/hero.png output=description
@core/files/save data=results path=~/output/results.json
@utils/load config=~/settings/app-config.json
```

AST shape:

```typescript
interface FileLiteralNode {
  type: 'literal-file'
  value: string  // e.g. "~/images/hero.png"
}
```

### Valid examples

```
~/images/hero.png
~/a
~/output/drivers/vettel/hero.png
~/race-data/2024_monaco-Q1.final.json
~/images/
```

## Glob Literal (`literal-glob`)

Use when you want to match multiple files by pattern. Requires at least one `*`.

```oto
@block/begin forEach=~/images/races/*.jpg -> photo
  @ai/describe image={photo} output=description
@block/end
```

AST shape:

```typescript
interface GlobLiteralNode {
  type: 'literal-glob'
  value: string  // e.g. "~/images/races/*.jpg"
}
```

### Supported glob patterns

| Pattern | Meaning |
|---------|---------|
| `~/images/*.jpg` | All `.jpg` files in `images/` |
| `~/images/**/*.jpg` | All `.jpg` files in `images/` recursively |
| `~/photos/*` | All files in `photos/` |

### How to tell File from Glob

The parser decides at parse time based on the presence of `*`:

- No `*` in the path -> `literal-file`
- At least one `*` -> `literal-glob`

There is no ambiguity. The parser tries glob first (more specific), then falls back to file.

## Usage Patterns

### Single file as command argument

```oto
@ai/describe image=~/images/hero.png output=description
```

### Glob as forEach source

The most common pattern. The glob resolves to an array of file references at runtime.

```oto
@block/begin forEach=~/images/races/*.jpg -> photo
  @ai/describe image={photo} output=description
@block/end
```

### Multiple file arguments in one command

```oto
@utils/copy source=~/input/data.json target=~/output/data.json
```

### Mixing file paths with other argument types

```oto
@ai/generate prompt="Describe this race" image=~/images/monaco.png output=description
@core/files/save data=description path=~/output/monaco-description.txt
```

### File paths in arrays

```oto
@utils/process files=[~/images/a.jpg, ~/images/b.jpg]
```

### File path inside braced expressions

```oto
@utils/log message={~/data/config.json}
```

## What the Parser Does NOT Do

The parser is syntax-only. It does not:

- Check if the file exists on disk
- Read file contents
- Expand glob patterns into file lists
- Resolve `~/` to an absolute path

All of that is the evaluator's or command's responsibility at runtime.

## Discriminant Summary for LLMs

When generating OTO code from a user prompt:

1. Does the user reference a **specific file**? -> Use `~/path/to/file.ext`
2. Does the user want to process **multiple files matching a pattern**? -> Use `~/path/*.ext` with `@block/begin forEach=`
3. Does the user need **recursive matching**? -> Use `~/path/**/*.ext`
4. Is the path **dynamic** (built from variables)? -> File literals won't help. Use the `|path` pipe instead: `{["output", name, "result.json"]|path}`
