---
'sku': minor
---

`vite` experimental support.

- Add experimental support for `vite` as a build tool.

## Usage

To enable `vite` as the build tool you will have to follow the steps below.

### Update sku.config.ts

First switch your project to `vite` by adding the following line to your `sku.config.ts`

```typescript
// sku.config.ts
import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite', // sku will use vite as the bundler.
  ...
} satisfies SkuConfig;
```

### Migrating your client entrypoint

With `vite` the `index.html` will be generated with a different id for the root element.
Make sure that your client entrypoint exports a function that hydrates the root element as the default export.

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

### Migrating your render entrypoint.

The interface for the render entrypoint has seen some more significant changes.

- The `renderToString` function has been replaced with `renderToPipeableStream`.
- The `renderApp` function has been renamed to `render`.
- The `SkuProvider` component has been removed from the `renderApp` function. Instead, you have to use the `LoadableProvider` from the `sku/vite/loadable` export.
- The `preloadAll` function has been added. Awaiting this function ensures that all `loadable` imported files will be preloaded before sku renders the page.
- The `renderDocument` function has been removed. It's functionality will be added in a future update.

```diff
import { StaticRouter } from 'react-router-dom/server';
- import { renderToString } from 'react-dom/server';
- import html from 'dedent';
- import type { Render } from 'sku';
+ import type { ViteRender } from 'sku';
+ import { renderToPipeableStream } from 'react-dom/server';
+ import { LoadableProvider, preloadAll } from 'sku/vite/loadable';

import App from './App';

export default {
-  renderApp: ({ SkuProvider, route, site }) => {
-    return renderToString(
-      <SkuProvider>
-        <StaticRouter location={route} context={{}}>
-          <App site={site} />
-        </StaticRouter>
-      </SkuProvider>,
-    );
-  },
+  render: async ({ options, renderContext, site, url }) => {
+     const { loadableCollector } = renderContext;
+
+     await preloadAll();
+
+     return renderToPipeableStream(
+       <LoadableProvider value={loadableCollector}>
+         <StaticRouter location={url} context={{}}>
+           <App site={site} />
+         </StaticRouter>
+       </LoadableProvider>,
+       options,
+     );
+  },

  provideClientContext: ({ site }) => ({
    site,
  }),

-  renderDocument: ({ app, bodyTags, headTags }) => {
-    return html/* html */ `
-      <!DOCTYPE html>
-      <html>
-        <head>
-          <meta charset="UTF-8" />
-          <title>hello-world</title>
-          <meta name="viewport" content="width=device-width, initial-scale=1" />
-          ${headTags}
-        </head>
-        <body>
-          <div id="app">${app}</div>
-          ${bodyTags}
-        </body>
-      </html>
-    `;
-  },
- } satisfies Render;
+ } satisfies ViteRender;
```

### Migrating from `sku/@loadable/components` to `sku/vite/loadable`

The `sku/@loadable/components` package has been replaced with `sku/vite/loadable`.

The new `sku/vite/loadable` package relies on the `react <Suspense>` component for the loading fallback.

```diff
- import loadable from 'sku/@loadable/component';
+ import { Suspense } from 'react';
+ import { loadable } from 'sku/vite/loadable';

- const Home = loadable(() => import('./Home'), {
-   fallback: <div>Loading Home...</div>,
- });
+ const Home = loadable(() => import('./Home'));

export default () => (
  <div>
+   <Suspense fallback={<div>Loading Home...</div>}>
    <Home />
+   </Suspense>
  </div>
);
```

### Using vite types

If `vite/client` reference types are needed in your project, you can import them from `sku/vite/client`.

```typescript
/// <reference types="sku/vite/client" />

// ... rest of your application
````

### Running `sku` with the `--experimental-bundler` flag

Now you can run your `sku` command with the new `--experimental-bundler` flag

```bash
sku build --experimental-bundler
```

The following commands are supported:
- `build` static site generation.
- `start` start the development server for static site generation.
- `start-ssr` start the development server for server side rendering.


> [!NOTE]
> This feature is still in the experimental stage and is not recommended for production use.
> Any issues that occur when using `vite` will not receive priority support.
