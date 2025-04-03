# Vite Support

> ⚠️ Vite support is currently experimental. Not all of sku's features are supported when using vite. Vite should _not_ be used for production applications.

## Getting started

To enable `vite` as the bundler you have to change your bundler in the `sku.config.ts` file.

```typescript
// sku.config.ts
import type { SkuConfig } from 'sku';

export default {
  __UNSAFE_EXPERIMENTAL__bundler: 'vite', // sku will use vite as the bundler.
  ...
} satisfies SkuConfig;
```

Now you can run your `sku` command with the new `--experimental-bundler` flag

```bash
sku build --experimental-bundler
```

### Supported commands

The following commands are supported:

- `build` static site generation.
- `start` start the development server for static site generation.

### Rendering

Before starting with `vite` rendering make sure you've read the [static rendering](./docs/static-rendering.md) documentation for webpack.

> [!NOTE]
> There are some differences between the two renderers.
> You can find a detailed explanation of the changes and how to migrate over down below.

### Code splitting

Code splitting is possible with the new `sku/vite/loadable` entrypoint.

The new `sku/vite/loadable` entrypoint relies on React's [`<Suspense />`](https://react.dev/reference/react/Suspense) component for the loading of a fallback state.

**Example of using `sku/vite/loadable`**

```tsx
import { Suspense } from 'react';
import { loadable } from 'sku/vite/loadable';

const Home = loadable(() => import('./Home'), {
  fallback: <div>Loading Home...</div>,
});

export default () => (
  <div>
    <Home />
  </div>
);
```

In order to use `loadable` with the fallback option you would need to render the application inside the `renderToStringAsync` function in the `render.tsx` file. See the example [here](./docs/static-rendering.md#renderApp) for more information.

If you run the vite command with the `--convert-loadable` flag, sku will automatically convert all the `loadable` components from `sku/@loadable/component` to the new imports.

### Dev server middleware

The `vite` dev server runs on a [`Connect`](https://github.com/senchalabs/connect) instance instead of [`Express`](https://expressjs.com/) so the middleware setup is slightly different. A middleware file still exports a single function however it now takes the [`ViteDevServer`](https://vite.dev/guide/api-javascript.html#vitedevserver) as the only parameter.
To add middleware to the dev server you should follow the connect guide [here](https://github.com/senchalabs/connect#use-middleware).

**Example of using `devServerMiddleware` with `vite`**

```typescript
// custom-middleware.ts
import type { ViteDevServer } from 'vite';

export default function (server: ViteDevServer) {
  server.middlewares.use((req, res, next) => {
    // your middleware logic
    next();
  });

  // or use a path
  server.middlewares.use('/api', (req, res, next) => {
    // your middleware logic
    next();
  });
}
```

### Using vite types

If [`vite/client` types](https://vite.dev/guide/features#client-types) are needed in your project, you can reference them via the `sku/vite/client` entrypoint:

```typescript
/// <reference types="sku/vite/client" />

// ... rest of your application
```
