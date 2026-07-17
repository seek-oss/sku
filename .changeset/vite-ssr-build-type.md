---
'sku': minor
'@sku-lib/create': minor
---

Add experimental Vite SSR via `buildType: 'ssr'`

**Experimental — not for production.** Vite SSR is available for evaluation and testing. Do not use it in production yet; the API and behaviour may change.

Full-document streaming for Server-Rendered Web Applications using Vite.

A new higher-level API allows you to return React Router routes directly, with first-class support for streaming using React Suspense, custom middleware and standard best-practices defaults out of the box.

Scaffold a new app with `@sku-lib/create`:

```sh
pnpm dlx @sku-lib/create my-app --template vite-ssr
```

Docs: [Vite](https://seek-oss.github.io/sku/#/./docs/vite), [Server rendering](https://seek-oss.github.io/sku/#/./docs/server-rendering) (including product docs for providers, middleware, CSP, and response headers, plus [Migrating from a static app](https://seek-oss.github.io/sku/#/./docs/server-rendering?id=migrate-from-static-app) and [Migrating from an older SSR app](https://seek-oss.github.io/sku/#/./docs/server-rendering?id=migrate-from-older-ssr-app)), [CSP](https://seek-oss.github.io/sku/#/./docs/csp), [Configuration](https://seek-oss.github.io/sku/#/./docs/configuration).
