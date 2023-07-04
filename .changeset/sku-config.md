---
'sku': patch
---

The extension of the sku config now correctly infers the type of source code:

- `sku.config.js` for JavaScript-only projects
- `sku.config.ts` for TypeScript projects

If you were previously using `sku.config.js` in TypeScript projects, you should rename it to `sku.config.ts`.
