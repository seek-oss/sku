---
'sku': major
---

Remove `rootResolution` in favour of native subpath imports

Node.js can now resolve path aliases natively via [subpath imports](https://nodejs.org/api/packages.html#subpath-imports) declared in your `package.json` `imports` field. Subpath import specifiers must be prefixed with `#`, so root-resolution imports like `import x from 'src/foo'` become `import x from '#src/foo'`.

The [`pathAliases`](https://seek-oss.github.io/sku/#/./docs/configuration?id=pathaliases) option is now available for both the `webpack` and `vite` bundlers. It generates TypeScript's `paths` configuration for editor/type support, and `sku` mirrors it into your `package.json` `imports` field so the aliases resolve natively at build time.

#### Migration

Run the `migrate-root-resolution` codemod to update your project. It rewrites `src/…` imports to `#src/…` and adds the matching `#src/*` entry to the `pathAliases` option in your sku config:

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

`sku` takes ownership of the `package.json` `imports` field and keeps it in sync with `pathAliases`, so you no longer need to maintain `imports` by hand. Any aliases you previously declared via `pathAliases` will be written to `imports` automatically.
