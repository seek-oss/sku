# Getting started

Server-Side Rendering creates an isomorphic React application that runs code on a live-server and client-side.

sku provides a high-level API built on [React Router Data Mode](https://reactrouter.com/start/modes#data).

Sku handles the HTTP server, Document shell, streaming, hydration, and CSP headers. You handle the specific page content and data.

Where possible, we hope to internalise common application solutions within sku, if you are looking to add an application level feature consider reaching out to [support](../support.md) to see if it can be added directly to sku.

Use `sku start` / `sku build` to start and build your app.

:::warning Experimental — not for production
SSR is available for evaluation and testing. Do not use it in production yet; the API and behaviour may change.
In the meantime, continue using [Webpack SSR](./webpack-ssr.md).
:::

Migrating from Webpack SSR? See [Migrate from Webpack SSR](./migrate-from-webpack-ssr.md).

When you're ready to ship, see [Deploy to production](./deploy-to-production.md).

## Scaffold a new app

Create a new SSR app and start a local development environment:

```bash
$ pnpm dlx @sku-lib/create my-app --template=vite-ssr
$ cd my-app
$ pnpm start
```

Or create in the current directory:

```bash
$ pnpm dlx @sku-lib/create . --template=vite-ssr
$ pnpm start
```

```sh
pnpm dlx @sku-lib/create my-app --template vite-ssr
cd my-app
pnpm start
```

## Configuring an SSR app

The `vite-ssr` template scaffolds `bundler: 'vite'`, `buildType: 'ssr'`, a relative `publicPath`, and the required named exports (`routes`, `onRequest`, `middleware`, `onHydrate`) at the default entry paths.
Interactive create also offers **SSR** as a distinct choice from **Static**.

See [Configuration](../configuration.md) for all options.

Configure:

```ts
import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  buildType: 'ssr',
  publicPath: '/',
  port: 3000,
} satisfies SkuConfig;
```

Notable exceptions to common configuration:

[`public`](../configuration.md#public) assets folder are not available. This can bypass production optimisation flows such as content-hashing that is required to ensure safe cacheability.

[`dangerouslySetViteConfig`](../configuration.md#dangerouslysetviteconfig) is not available. This would allow dangerous direct control over sku internals and would be likely break between releases.
Raise exceptional Vite customisation requirements with [support].

[support]: /support
