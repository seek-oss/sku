---
'sku': major
---

Remove type-only imports during transpilation and enforce correct type-only import syntax with `verbatimModuleSyntax: true`

This change enables babel to mimic the behaviour of TypeScript's [`verbatimModuleSyntax`] compiler option. The following code demonstrates the result of this change when transpiling TypeScript to JavaScript:

```ts
// Erased entirely
import type { A } from "a";

// Rewritten to `import { b } from "bcd";`
import { b, type c, type d } from "bcd";

// Rewritten to `import {} from "xyz";`
import { type xyz } from "xyz";
```

This change is not expected to have an effect on bundled application code or library code. However, it may surface some TypeScript errors in `compilePackage` dependencies that do not adhere to the correct type-only import syntax. These errors should be fixed in the dependency's codebase.

[`verbatimModuleSyntax`]: https://www.typescriptlang.org/tsconfig#verbatimModuleSyntax
