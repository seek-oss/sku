# Getting started

:::warning Experimental — SSR Managed Data Mode
This documentation covers the new vite-based SSR Managed Data Mode.
This is available for experimentation.
See [Webpack SSR](./webpack-ssr.md) for existing production support.
:::

Server-side rendering builds an isomorphic React app that renders on the server for each request, then hydrates in the browser.

This path uses **Managed Data Mode**.
sku owns the HTTP server, HTML document, streaming, hydration, and CSP headers.
It wires [React Router Data Mode](https://reactrouter.com/start/modes#data) for routing and data.
You own pages, data, and providers.

:::danger Experimental — not for production
Managed Data Mode SSR is available for evaluation and testing. Do not use it in production yet; the API and behaviour may change.
In the meantime, continue using [Webpack SSR](./webpack-ssr.md).
:::

## Scaffold a new app

```bash
$ pnpm dlx @sku-lib/create my-app --template=ssr
$ cd my-app
$ pnpm start
```

Or in the current directory:

```bash
$ pnpm dlx @sku-lib/create . --template=ssr
$ pnpm start
```

Interactive create also offers **SSR** as a choice alongside **Static**.

## What’s in the scaffold

After scaffolding you get three app entries:

- `src/server.tsx` — server setup (middleware, optional getters)
- `src/client.tsx` — hydrate-time setup
- `src/routes.tsx` — your React Router route tree

The template also sets up a root layout (for providers like Braid), page modules under `src/pages/`, and typed hooks via [`createSkuContexts`](./providers.md#typed-hooks) from `sku/runtime`.

## Configuration

Minimum SSR config:

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

Because sku owns more of the server and build in Managed Data Mode SSR, these options are not supported and are not planned:

- Absolute `publicPath` (for example `https://seekcdn.com/*`)
- [`public`](../configuration.md#public) assets folder
- [`dangerouslySetViteConfig`](../configuration.md#dangerouslysetviteconfig)
- [`vitePlugins`](../configuration.md#viteplugins)

For exceptional requirements raise a query via [support](../support.md).

## Next steps

- [Routing](./routing.md) — add pages
- [Request entries](./entries.md) — middleware and per-request getters
- [Providers](./providers.md) — pass values into React
- [Data loading](./data-loading.md) — fetch page content
- [Deploy to production](./deploy-to-production.md) — when you’re ready to ship
- [Migrate from Webpack SSR](./migrate-from-webpack-ssr.md)
- [Migrate from Static App](./migrate-from-static-app.md)

Looking to add an application-level feature that many apps might share? Reach out via [support](../support.md) — we prefer to internalise common solutions in sku where it makes sense.
