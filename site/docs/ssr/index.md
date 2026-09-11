# Getting started

> [!WARNING]
> Experimental — SSR Managed Data Mode.
> This documentation covers Vite-based SSR Managed Data Mode.
> This is available for experimentation.
> See [Webpack SSR](./webpack-ssr.md) for existing production support.

Server-side rendering (SSR) renders a React app on the server for each request.
The browser then hydrates that HTML.
An isomorphic app is one that renders on the server and in the browser.

This path uses **Managed Data Mode**.
sku provides the HTTP server, HTML document, streaming, hydration, and CSP headers.
It wires [React Router Data Mode](https://reactrouter.com/start/modes#data) for routing and data.
You provide pages, data, and providers.

> [!CAUTION]
> Experimental — not for production.
> Managed Data Mode SSR is available for evaluation and testing. Do not use it in production yet. The API and behaviour may change.
> Until then, use [Webpack SSR](./webpack-ssr.md).

## Scaffold a new app

```bash
$ pnpm dlx @sku-lib/create my-app --template=ssr
$ cd my-app
$ pnpm start
```

Create the app in the current directory:

```bash
$ pnpm dlx @sku-lib/create . --template=ssr
$ pnpm start
```

Interactive create also offers **SSR** as a choice alongside **Static**.

## What’s in the scaffold

After scaffolding, the app includes three entries:

- `src/server.tsx` — server configuration (middleware, optional getters)
- `src/client.tsx` — hydrate-time configuration
- `src/routes.tsx` — your React Router route tree

The template also creates a root layout for providers such as Braid.
It adds page modules under `src/pages/`.
It adds typed hooks via [`createSkuContexts`](./providers.md#typed-hooks) from `sku/runtime`.

## Configuration

This is the minimum SSR config:

```ts
import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  buildType: 'ssr',
  publicPath: '/',
  port: 3000,
} satisfies SkuConfig;
```

See [Configuration](../configuration.md) for all options.

### Unsupported configuration

sku handles more of the server and build in Managed Data Mode SSR.
These options are not supported, and they are not planned:

- Absolute `publicPath` (for example `https://seekcdn.com/*`)
- [`public`](../configuration.md#public) assets folder
- [`dangerouslySetViteConfig`](../configuration.md#dangerouslysetviteconfig)
- [`vitePlugins`](../configuration.md#viteplugins)

For exceptional requirements, raise a query via [support](../support.md).

## Next steps

- [Routing](./routing.md) — add pages
- [Request entries](./entries.md) — middleware and per-request getters
- [Providers](./providers.md) — pass values into React
- [Data loading](./data-loading.md) — load page content
- [Deploy to production](./deploy-to-production.md) — when you’re ready to ship
- [Migrate from Webpack SSR](./migrate-from-webpack-ssr.md)
- [Migrate from Static App](./migrate-from-static-app.md)

If you need an application-level feature that many apps may share, contact [support](../support.md).
sku prefers to internalise common solutions when that makes sense.
