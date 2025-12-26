## DSL Update

The desgin of 1.0 shows a major DSL update. However it's important to make the
whole thing works, as there are still things to test and we need to make the
integration engine work asap with v0.5



## Decisisons

Should ArgTokens object return a Node or the Value ?

This is ambigous

```typescript
export interface UnaryTokens {
  NOT: SingleParser<'!'>
  PLUS: SingleParser<'+'>
  MINUS: SingleParser<'-'>
  IDENTIFIER: SingleParser<IdentifierNode>
  NUMBER: SingleParser<LiteralNumberNode>
  STRING: SingleParser<LiteralStringNode>
  //SINGLE_STRING: SingleParser<LiteralStringNode>
  BOOLEAN: SingleParser<LiteralBooleanNode>
  // PIPE_EXPRESSION: SingleParser<(string | number | boolean)[]>
}
```

So for 0.5, we keep it like that, and we'll take a decision for 0.6
