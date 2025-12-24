TODO: add the array primary: will be done later
WIP and current priority: Work on the PipeChainNode and Pipe expression in the AST

```grammar
primary        := literal
                | identifier
                | '(' expression ')'

member         := primary ('.' IDENT)+               // dot-only; no [expr]

postfix        := member|primary                      // no function calls here

unary          := ('!' | '+' | '-') postfix

multiplicative := chainLeft(postfix|unary,       ('*' | '/' | '%'),  makeBinary)
additive       := chainLeft(multiplicative, ('+' | '-'),     makeBinary)
comparison     := chainLeft(additive,     ('<' | '<=' | '>' | '>='), makeBinary)
equality       := chainLeft(comparison,   ('==' | '!='),     makeBinary)
logicalAnd     := chainLeft(equality,     '&&',              makeLogical)   // left-assoc
logicalOr      := chainLeft(logicalAnd,   '||',              makeLogical)   // left-assoc

// Pipe is value-first, stage separator `|`, arg separator `:`
pipe           := logicalOr ( '|' IDENT ( ':' expression )* )+   → PipeChainNode

expression     := pipe | logicalOr


```
