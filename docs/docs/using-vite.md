# Using Vite

`vite` experimental support.

### Getting started

To enable `vite` as the bundler you have to change your bundler in the `sku.config.ts` file.

```typescript
// sku.config.ts
import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite', // sku will use vite as the bundler.
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
- `start-ssr` start the development server for server side rendering.

### Static rendering

Before starting with `vite` static rendering make sure you've read the [static rendering](static-rendering.md) documentation for webpack.

### Client entrypoint

For static rendering you would still need the same client entrypoint. There is one small change and thats the id of the root element. This has changed to `'root'`. See the example below.

```diff
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import { App } from './App';

export default ({ site }: { site: string }) => {
  hydrateRoot(
+    document.getElementById('root')!,
-    document.getElementById('app')!,
    <BrowserRouter>
      <App site={site} />
    </BrowserRouter>,
  );
};
```

### Render entrypoint

The render entrypoint file has to export a `ViteRender` object. The `ViteRender` object has two functions `render` and `provideClientContext`.

**render**

The `render` function should return your application as a pipeable stream (using `React.renderToPipeableString`).

`render` will be called once for each combination of settings in sku config. Specifically, `environment`, `site` & `route`.

If you are using `loadable` components, you should wrap your application in a `LoadableProvider` from `sku/vite/loadable`. This will search your rendered application for dynamic imports that are wrapped in a `loadable` function.
By calling the `await preloadAll()` function, you can ensure that all `loadable` imported files will be preloaded before sku renders the page.

**provideClientContext**

`provideClientContext` is an optional function that runs after `render`. It is used to pass context between the static render and the client code. This is useful for passing config values (e.g. API endpoints, feature switches) or state information (e.g. redux state). The object this function returns will be passed to the client entry.

The function receives `environment` and `site`

**Example of a render entrypoint with `vite`**

```tsx
import { StaticRouter } from 'react-router-dom/server';
import type { ViteRender } from 'sku';
import { renderToPipeableStream } from 'react-dom/server';
import { LoadableProvider, preloadAll } from 'sku/vite/loadable';

import App from './App';

export default {
  render: async ({ options, renderContext, site, url }) => {
    const { loadableCollector } = renderContext;

    await preloadAll();

    return renderToPipeableStream(
      <LoadableProvider value={loadableCollector}>
        <StaticRouter location={url} context={{}}>
          <App site={site} />
        </StaticRouter>
      </LoadableProvider>,
      options,
    );
  },

  provideClientContext: ({ site }) => ({
    site,
  }),
} satisfies ViteRender;
```

### Code splitting

Code splitting is possible with the new `sku/vite/loadable` entrypoint.

The new `sku/vite/loadable` entrypoint relies on React's [`<Suspense />`](https://react.dev/reference/react/Suspense) component for the loading of a fallback state.

**Example of using `sku/vite/loadable`**

```tsx
import { Suspense } from 'react';
import { loadable } from 'sku/vite/loadable';

const Home = loadable(() => import('./Home'));

export default () => (
  <div>
    <Suspense fallback={<div>Loading Home...</div>}>
      <Home />
    </Suspense>
  </div>
);
```

### Using vite types

If `vite/client` reference types are needed in your project, you can import them from `sku/vite/client`.

```typescript
/// <reference types="sku/vite/client" />

// ... rest of your application
```
