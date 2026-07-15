---
'sku': major
---

`config`: Remove `rootResolution` in favour of native subpath imports

Node.js can now resolve path aliases natively via [subpath imports](https://nodejs.org/api/packages.html#subpath-imports) in `package.json#imports`. `sku`'s [`pathAliases`](https://seek-oss.github.io/sku/#/./docs/configuration?id=pathaliases) option now uses this and works with both the `webpack` and `vite` bundlers.

`sku` generates `tsconfig.json#paths` from your `pathAliases` option and mirrors them into `package.json#imports` so aliases resolve natively at build time. Specifiers must use a `#` prefix, so `import x from 'src/foo'` becomes `import x from '#src/foo'`.

`sku` takes ownership of the `package.json` `imports` field and keeps it in sync with `pathAliases`, so you no longer need to maintain `imports` by hand.

#### Migration

Run the `migrate-root-resolution` codemod to update your project. It rewrites `src/...` imports to `#src/...` and adds the matching `#src/*` entry to the `pathAliases` option in your sku config:

```sh
pnpm dlx @sku-lib/codemod migrate-root-resolution .
```

After running the codemod, your sku config will contain:

```ts
export default {
  pathAliases: {
    '#src/*': './src/*',
  },
} satisfies SkuConfig;
```
**Note:** Any other custom aliases will need to be manually migrated by adding the alias to `pathAliases` and find-and-replacing the specifier in your codebase to add a `#` prefix.
