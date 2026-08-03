# Migrate from Static App

:::danger Experimental — not for production
SSR with Managed Data Mode is available for evaluation and testing. Do not use it in production yet; the API and behaviour may change.
In the meantime, continue using [Webpack SSR](./webpack-ssr.md).
:::

High-level guide for moving a **static** sku app (webpack or Vite SSG) to SSR.
For day-to-day API detail, prefer the [Getting started](./) topic pages.

## Requirements

- SSR is Vite-only: `bundler: 'vite'` + `buildType: 'ssr'`
- Relative `publicPath` (for example `/`) — absolute / CDN URLs are not supported
- Move off the config [`public`](../configuration.md#public) assets folder — import assets from modules instead
- Drop [`dangerouslySetViteConfig`](../configuration.md#dangerouslysetviteconfig) and [`vitePlugins`](../configuration.md#viteplugins) — unsupported for SSR; raise use-cases via [support](../support.md)

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

- Drop static-only config such as `renderEntry` / `src/render.tsx` and environments-driven static HTML generation
- Remove or empty the [`public`](../configuration.md#public) assets folder

## Routes and request entries

- Replace the static page + `render.tsx` / `#app` client with [`routesEntry`](../configuration.md#routesentry) exporting `routes` — see [Routing](./routing.md)
- Default-export request entries via `defineServerEntry` / `defineClientEntry` — see [Request entries](./entries.md)
- Export `getSite` when config has more than one site; omit on single-site apps
- Lazy page modules must export named `Component` (not `export default`)

## Providers and data

- Wire [`createSkuContexts`](./providers.md) and mount isomorphic providers in your root layout
- Prefer [render-time data loading](./data-loading.md) for page content
- Production Express handlers go on server-entry `middleware`; local mocks stay in [`devServerMiddleware`](../configuration.md#devservermiddleware) — see [Middleware](./middleware.md)

## CSP and hydration

- SSR emits **HTTP header** CSP, not meta `http-equiv` — see [CSP](./csp.md)
- Replace `#app` `hydrateRoot` and `renderDocument` with sku’s full-document stream + `hydrateRoot(document)`
- Use React document metadata in routes/layouts for head/SEO; the Document shell is not overridable
