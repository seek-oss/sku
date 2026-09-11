# Migrate from Static App

> [!CAUTION]
> Experimental — not for production.
> Managed Data Mode SSR is available for evaluation and testing. Do not use it in production yet. The API and behaviour may change.
> Until then, continue using [Webpack SSR](./webpack-ssr.md).

High-level guide for moving a **static** sku app (webpack or Vite static site generation) to Managed Data Mode SSR.
For day-to-day API detail, prefer the [Getting started](./) topic pages.

## Requirements

- SSR is Vite-only: `bundler: 'vite'` and `buildType: 'ssr'`
- Relative `publicPath` (for example `/`). Absolute and CDN URLs are not supported
- Stop using the config [`public`](../configuration.md#public) assets folder. Import assets from modules instead
- Remove [`dangerouslySetViteConfig`](../configuration.md#dangerouslysetviteconfig) and [`vitePlugins`](../configuration.md#viteplugins). SSR does not support them. Report use-cases via [support](../support.md)

## Config and commands

```ts
import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite', // [!code ++]
  buildType: 'ssr', // [!code ++]
  publicPath: '/',
  renderEntry: './src/render.tsx', // [!code --]
} satisfies SkuConfig;
```

- Remove static-only config such as `renderEntry` and `src/render.tsx`, and environments-driven static HTML generation
- Remove or empty the [`public`](../configuration.md#public) assets folder

## Routes and request entries

Compose routes with `path` (or `index`) and `lazy` in [`routesEntry`](../configuration.md#routesentry).
Put `loader`, `action`, and `Component` on page modules. See [Routing](./routing.md).
Optional `mapRoutePath` maps one logical path to per-site concrete paths. See [Multi-language](./multi-language.md#maproutepath).

Default-export request entries from `defineServerEntry` and `defineClientEntry`. See [Request entries](./entries.md).

Export `getSite` when config has more than one site. Omit `getSite` on single-site apps.
Lazy page modules must export a named `Component` (not `export default`).

## Providers and data

Wire [`createSkuContexts`](./providers.md#typed-hooks). Mount isomorphic providers in your root layout.
Prefer [render-time data loading](./data-loading.md) for page content.

Production Express handlers go on server-entry `middleware`.
Local mocks stay in [`devServerMiddleware`](../configuration.md#devservermiddleware). See [Middleware](./middleware.md).

## CSP and hydration

SSR emits **HTTP header** CSP, not meta `http-equiv`. See [CSP](./csp.md).

Replace `#app` `hydrateRoot` and `renderDocument` with sku’s full-document stream and `hydrateRoot(document)`.
Render `<html>`, `<head>`, and `<body>` in your root layout.
Sku hoists stylesheet and `modulepreload` links into `<head>`.
Nest `ErrorBoundary` on a child route under that layout so the HTML document stays mounted on failure.
Move hoistable SEO tags (`<title>`, `<meta>`, `<link>`) into routes and layouts as React document metadata.
Put non-hoistable tags in the root layout `<head>`.

## See also

- [Getting started](./) — scaffold and config
- [Routing](./routing.md) — route tree and page modules
- [Request entries](./entries.md) — server and client entries
- [Providers](./providers.md) — typed hooks and root layout
- [Data loading](./data-loading.md) — render-time fetch
- [Middleware](./middleware.md) — Express vs dev mocks
- [CSP](./csp.md) — header CSP
