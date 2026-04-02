---
'@sku-lib/codemod': minor
---

Add `svg-import-query-param` codemod to convert `import svg from './file.svg'` imports to `import svg from './file.svg?raw'`

This codemod migrates all SVG imports to include the `?raw` query parameter. This ensures that SVG import behaviour is consistent between Vite and Webpack.

**EXAMPLE USAGE:**

```sh
pnpm dlx @sku-lib/codemod svg-import-query-param .
```

See the [Vite migration docs] for more information.

[Vite migration docs]: https://seek-oss.github.io/sku/#/./docs/vite?id=migrating-svg-imports
