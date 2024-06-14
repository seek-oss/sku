---
'sku': major
---

Remove type-only imports during transpilation

This change enables babel to mimic the behaviour of TypeScript's [`verbatimModuleSyntax`] compiler option. The following code demonstrates the result of this change when transpiling TypeScript to JavaScript:

```ts
// Erased entirely
import type { A } from "a";

// Rewritten to `import { b } from "bcd";`
import { b, type c, type d } from "bcd";

// Rewritten to `import {} from "xyz";`
import { type xyz } from "xyz";
```

Since bundled code should not contain `import` statements, this change should not affect the output of most app code. Additionally, since our ESLint config ensures that `import { type xyz }` is transformed into `import type { xyz }`, this change is unlikely to affect library code either.

[`verbatimModuleSyntax`]: https://www.typescriptlang.org/tsconfig#verbatimModuleSyntax
