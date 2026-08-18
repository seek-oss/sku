---
'sku': patch
---

Fix Vanilla Extract styles in dependencies that ship `.css.ts` source

When a dependency shipped Vanilla Extract source rather than compiled CSS, Vite's dependency
prebundling could inline its `.css.ts` files. Prebundling runs without the Vite plugin pipeline,
so the Vanilla Extract plugin never assigned those files a scope, and `style()` threw
`Styles were unable to be assigned to a file` in the browser.

sku already externalised Vanilla Extract files out of the prebundle, but only matched imports
that included the full extension, such as `./styles.css.ts`. Vanilla Extract files are
conventionally imported without it, as `./styles.css`, so source-shipping packages were missed.
Those files are now matched on their resolved path instead of the import specifier.

Excluding the package from `optimizeDeps` is no longer necessary to work around this, so its
CommonJS dependencies no longer need to be listed in `optimizeDeps.include`.
