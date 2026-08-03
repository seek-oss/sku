---
'sku': minor
'@sku-lib/create': minor
---

Add experimental Managed Data Mode SSR via `buildType: 'ssr'`

**Experimental — not for production.**
SSR is available for evaluation and testing.
Do not use it in production yet; the API and behaviour may change.

Sku’s application contract is **Managed Data Mode**: sku-owned Document, streaming/hydration, Node server, and CSP, with React Router Data Mode wired for routing and data.
Apps own routes, data, and providers.
Import helpers from `sku/runtime` (`defineServerEntry` / `defineClientEntry`, `createSkuContexts`, `useInsertHtml`, `usePreloadRoute`, …).
Types drop an `Ssr` infix (`SkuProvider`, `SkuRouteObject`, `SkuServerEntry`, …).
SSR is the render strategy (`buildType: 'ssr'`); a future Static path is expected to share the same Managed Data Mode APIs.

Scaffold a new app with `@sku-lib/create`:

```sh
pnpm dlx @sku-lib/create my-app --template ssr
```

Docs: [Vite](https://seek-oss.github.io/sku/#/./docs/vite), [Server rendering](https://seek-oss.github.io/sku/#/./docs/ssr/) (including providers, middleware, CSP, and migration guides), [CSP](https://seek-oss.github.io/sku/#/./docs/csp), [Configuration](https://seek-oss.github.io/sku/#/./docs/configuration).
