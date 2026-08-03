---
'sku': minor
'@sku-lib/create': minor
---

Add experimental Managed Data Mode SSR via `buildType: 'ssr'`

**Experimental — not for production.**
Managed Data Mode SSR is available for evaluation and testing.
Do not use it in production yet; the API and behaviour may change.

**Managed Data Mode** enables sku to own the HTML Document, streaming/hydration, the Node server, and CSP.
sku wires React Router Data Mode for routing and data.
Apps own routes, data, and providers.


Scaffold a new app with `@sku-lib/create`:

```sh
pnpm dlx @sku-lib/create my-app --template ssr
```

Docs: [Vite](https://seek-oss.github.io/sku/#/./docs/vite), [Server rendering](https://seek-oss.github.io/sku/#/./docs/ssr/) (including providers, middleware, CSP, and migration guides), [CSP](https://seek-oss.github.io/sku/#/./docs/csp), [Configuration](https://seek-oss.github.io/sku/#/./docs/configuration).
