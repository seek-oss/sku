# Troubleshooting

:::danger Experimental — not for production
Managed Data Mode SSR is available for evaluation and testing. Do not use it in production yet; the API and behaviour may change.
In the meantime, continue using [Webpack SSR](./webpack-ssr.md).
:::

Common Managed Data Mode SSR issues and fixes.
Hit something not covered here? Raise it via [support](../support.md) so we can help and expand this guide.

## CJS default-export interop

Some CommonJS packages expose both a default and named exports.
Under SSR `sku start`, importing such a package as a React component can resolve to a module namespace object (`{ default: ActualComponent, … }`).
React then fails with:

```
Element type is invalid: expected a string … but got: object.
You likely forgot to export your component … or you might have mixed up default and named imports.
```

Production `sku build` may still succeed for the same import — the failure is often start-only.

Add the package name to [`__UNSAFE_EXPERIMENTAL__cjsInteropDependencies`](../configuration.md#__unsafe_experimental__cjsinteropdependencies) (sku already includes Apollo Client in its defaults):

```ts
// sku.config.ts
import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  buildType: 'ssr',
  __UNSAFE_EXPERIMENTAL__cjsInteropDependencies: [
    'react-helmet-async',
    'some-legacy-cjs-ui-kit',
  ],
} satisfies SkuConfig;
```

Prefer upgrading to an ESM build or replacing the dependency when possible.

## See also

- [Configuration](../configuration.md#__unsafe_experimental__cjsinteropdependencies) — CJS interop list
- [Support](../support.md) — raise new issues
- [Getting started](./) — Managed Data Mode overview
