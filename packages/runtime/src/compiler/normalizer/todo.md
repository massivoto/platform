To work, normalizer needs standard identifier.

But identifier token is defined as NOT being a keyword.

```
export const identifier = F.regex(/[a-zA-Z_][a-zA-Z0-9_-]*/)
.filter((s) => s.charAt(s.length - 1) !== '-')
.filter((s) => !reservedWords.includes(s))
```

And obviously 'if' and `forEach` are reserved words.

So we must declare `output`, `if` and `forEach` arguments in another category.