# Server rendering

Sku supports two SSR models:

1. **Vite SSR** (recommended for new apps) — `bundler: 'vite'` + `renderType: 'server-side-rendered'`, using `sku start` / `sku build`
2. **Webpack SSR** (existing) — `sku start-ssr` / `sku build-ssr` with a low-level `serverEntry` `renderCallback`

## Vite SSR

### React Router Data Mode

Vite SSR largely wraps [React Router Data Mode](https://reactrouter.com/start/modes#data). You declare a `RouteObject[]` tree from `appEntry`; sku owns the HTTP server, document shell, streaming, and hydration, and wires that route config into React Router on the server and in the browser. Loaders, actions, lazy routes, nested layouts, and error boundaries are standard Data Mode APIs.

For information on how to use React Router to register routes, see [React Router Data Mode](https://reactrouter.com/start/data/routing).

Requires React 19+. Configure:

```ts
import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  renderType: 'server-side-rendered',
  appEntry: 'src/app.tsx', // default
  publicPath: '/', // relative only — absolute / CDN URLs are rejected
  port: 3000,
} satisfies SkuConfig;
```

Export a `SkuApp` from `appEntry`. Prefer co-locating each page in its own directory with a `route.ts` (path / lazy / loaders / handle) and the page module (e.g. `home.tsx`). Compose those route modules into an explicit `routes` array:

```tsx
// src/pages/home/route.ts
import type { RouteObject } from 'react-router';

export const homeRoute = {
  index: true,
  // Idiomatic lazy — sku auto-derives handle.moduleId for production modulepreloads
  lazy: () => import('./home.js'),
} satisfies RouteObject;
```

```tsx
// src/app.tsx
import type { SkuApp } from 'sku';
import type { RouteObject } from 'react-router';

import { homeRoute } from './pages/home/route.js';

const routes: RouteObject[] = [
  {
    path: '/',
    children: [homeRoute],
  },
];

export default {
  routes,
  // Optional Connect/Express-compatible middleware (runs before HTML render)
  middleware: (req, res, next) => next(),
} satisfies SkuApp;
```

sku owns:

- the HTTP(S) server (dev: Vite `middlewareMode` + HMR on one port; prod: `node dist/server/server.js`)
- the React Document shell (`<html>` / `<head>` / `<body>` with CSS + modulepreload links) — not overridable; use React 19 metadata in routes/layouts for head/SEO
- full-document streaming with `renderToPipeableStream` (shell-first; set route `handle.waitForAll` to buffer until `onAllReady`)
- document-level hydration (`hydrateRoot(document, …)`), not `#app`
- CSP as HTTP headers when `cspEnabled` / `cspReportOnlyEnabled` are set
- forwarding React Router loader/action headers (e.g. `Set-Cookie`) onto streamed HTML responses

Put request middleware on `SkuApp.middleware` (not config `devServerMiddleware`). `httpsDevServer: true` is supported for Vite SSR `sku start`.

Do **not** use `sku start-ssr` / `sku build-ssr` when `renderType` is set.

### Lazy routes and `handle.moduleId`

Prefer React Router’s idiomatic lazy form so each route is a separate async chunk (on server and client). Put that `lazy` on the page’s `route.ts` so sku can auto-derive `handle.moduleId` from a single string-literal `import()` during the Vite SSR transform:

```tsx
// src/pages/about/route.ts
export const aboutRoute = {
  path: 'about',
  lazy: () => import('./about.js'),
} satisfies RouteObject;

// src/pages/details/route.ts
export const detailsRoute = {
  path: 'details',
  lazy: () => import('./details.js'),
} satisfies RouteObject;
```

Do **not** statically import those page modules into `appEntry` or `route.ts` — that eagerly bundles them and defeats per-route chunking. Import only the route configs. The `fixtures/vite-ssr` app demonstrates this pattern with distinct `about` and `details` chunks.

**Escape hatch:** set `handle.moduleId` explicitly to the Vite client manifest key (usually the source path, e.g. `src/pages/about/about.tsx`) when you need a custom key or a non-idiomatic `lazy` shape. An explicit value is never overwritten.

sku does **not** guess for non-idiomatic shapes (no injection):

- granular `lazy: { Component: … }`
- lazy functions with multiple `import()` calls
- indirect bindings (`lazy: loadAbout`)

In development, sku warns when a lazy route still has no effective `moduleId` after transform, or when a provided `moduleId` is not found in the client manifest.

### Vocab / language chunks

When `languages` is configured, Vite SSR keeps `@vocab/vite` language chunk splitting and registers the active language chunk (`en-translations`, …) on the Document asset path — same idea as static Vite and webpack SSR `addLanguageChunk`.

sku resolves the language from (in order):

1. **Request language slot (preferred)** — set `req.skuLanguage` in Express middleware to a configured language **name** (e.g. `th-TH`), not necessarily a URL segment. Read the same value from loaders/actions with `getSkuLanguage()` from `sku`.
2. a `:language` route param on a matched route when it matches a configured language name (convenience for demos)
3. the sole configured language when only one language is set

If the language cannot be resolved (or the request slot is set to an unknown name), sku soft-fails: it skips vocab chunk registration and does not error the response.

Prefer the request slot when locale is composed in middleware (e.g. site/region + language prefix → `th-TH`). Route heuristics are a convenience, not the product contract for multi-site apps.

```tsx
// src/app.tsx
import type { SkuApp } from 'sku';

export default {
  routes: [/* … */],
  middleware: (req, _res, next) => {
    // Must match a name from sku config `languages` (or `en-PSEUDO`)
    req.skuLanguage = resolveLocaleFromRequest(req); // e.g. 'th-TH'
    next();
  },
} satisfies SkuApp;
```

Wrap your UI in `VocabProvider` as usual (see [Multiple languages](./docs/multi-language.md)). Route-param example:

```tsx
// src/RootLayout.tsx
import { VocabProvider } from '@vocab/react';
import { Outlet, useParams } from 'react-router';

export const RootLayout = () => {
  const { language = 'en' } = useParams();
  return (
    <VocabProvider language={language}>
      <Outlet />
    </VocabProvider>
  );
};

// src/pages/hello/route.ts
export const helloRoute = {
  path: ':language/hello',
  lazy: () => import('./hello.js'),
} satisfies RouteObject;
```

### Error pages

Route errors (loader failures, thrown `data()`, `404`, and `405` when a mutation hits a route without an `action`) are React Router error responses. sku streams the document with `context.statusCode` and renders the nearest route `ErrorBoundary` (or React Router’s default error UI). Customize content with [React Router Error Boundaries](https://reactrouter.com/how-to/error-boundary).

```tsx
// src/RootLayout.tsx
import { isRouteErrorResponse, Outlet, useRouteError } from 'react-router';

export const RootLayout = () => <Outlet />;

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <main>
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{typeof error.data === 'string' ? error.data : null}</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Something went wrong</h1>
    </main>
  );
}
```

```tsx
// src/app.tsx — attach ErrorBoundary on the root route
import type { SkuApp } from 'sku';
import type { RouteObject } from 'react-router';

import { ErrorBoundary, RootLayout } from './RootLayout.js';
import { homeRoute } from './pages/home/route.js';

const routes: RouteObject[] = [
  {
    path: '/',
    Component: RootLayout,
    ErrorBoundary,
    children: [homeRoute],
  },
];

export default { routes } satisfies SkuApp;
```

### Production

`sku build` emits sibling directories under the build target (e.g. `dist/`):

- `client/` — browser assets and the Vite client manifest
- `server/` — runnable Node server entry (`server.js`) and SSR bundle

```sh
sku build
node dist/server/server.js
# optional: PORT=8080 node dist/server/server.js
```

Deploy both `client/` and `server/` together. Client assets are served from `dist/client/` under the relative `publicPath`. Absolute / CDN `publicPath` is not supported for Vite SSR.

## Webpack SSR

The default mode for sku is to statically render projects. However, Webpack Server-Side Rendering (SSR) can explicitly be turned on, both in development with hot module reloading for React, and in production.

First, you need to create a `sku.config.js` file, which will contain the following setup at minimum:

```ts
export default {
  clientEntry: 'src/client.js',
  serverEntry: 'src/server/server.js',
  public: 'src/public',
  publicPath: '/',
  target: 'dist',
  port: 3300,
  serverPort: 3301,
} satisfies SkuConfig;
```

If you have an existing configuration, for example generated with `@sku-lib/create`, you will need to replace the `render` entry point by a `server` entry point, and add port info as documented above.

Then, you need to create your `server` entry. Sku will automatically provide an [Express](https://expressjs.com/) server for the user. The entry point for SSR, `server`, is used to provide the following:

- a render callback
- optionally, any required middlewares, either one or an array
- optionally, a callback to run after the server starts, which receives the Express application instance as a parameter

This can be done as follows:

```tsx
import template from './template';
import middleware from './middleware';
import type { Server } from 'sku';

export default (): Server => ({
  renderCallback: ({ SkuProvider, getBodyTags, getHeadTags }, req, res) => {
    const app = renderToString(
      <SkuProvider>
        <App />
      </SkuProvider>,
    );
    res.send(
      template({ headTags: getHeadTags(), bodyTags: getBodyTags(), app }),
    );
  },
  middleware: middleware,
  onStart: (app) => {
    console.log('My app started 👯‍♀️!');
    app.keepAliveTimeout = 20000;
  },
});
```

## Multi-part response

If you need to return HTML at different times in the request you can use `flushHeadTags` to retrieve only the new head tags since the previous call.

New head tags can be added during render, typically this is due to dynamic chunks being used during a render.

For example, you may want to send back an initial response before you are done rendering your response:

```tsx
import { initialResponseTemplate, followupResponseTemplate } from './template';
import middleware from './middleware';
import type { Server } from 'sku';

export default (): Server => ({
  renderCallback: ({ SkuProvider, getBodyTags, getHeadTags }, req, res) => {
    res.status(200);
    // Call `flushHeadTags` early to retrieve whatever tags are available.
    res.write(initialResponseTemplate({ headTags: flushHeadTags() }));
    await Promise.resolve();

    const app = renderToString(
      <SkuProvider>
        <App />
      </SkuProvider>,
    );

    res.write(
      // Call `flushHeadTags` again just in case new tags are available.
      followupResponseTemplate({
        headTags: flushHeadTags(),
        bodyTags: getBodyTags(),
        app,
      }),
    );
    res.end();
  },
  middleware: middleware,
  onStart: (app) => {
    console.log('My app started 👯‍♀️!');
    app.keepAliveTimeout = 20000;
  },
});
```

Last but not least, please note that commands for SSR are different to the ones used normally:

- Use `sku start-ssr` to start your development environment. It uses both `port` and `serverPort` to spin up hot module reloading servers.
- Use `sku build-ssr` to build your production assets. You can then run `node ./dist/server.js`. Your server will run at `http://localhost:xxxx`, where `xxxx` is `serverPort`.
- Use `sku test` to test your application

## Multi-language support

When using multiple languages the browser will download the language needed as required. However, this can lead to a delay in page load. To ensure translations are available immediately you need to tell sku what language you are rendering.

**Vite SSR:** set `req.skuLanguage` in middleware to the configured language **name** (preferred), or rely on route heuristics (`:language` / sole-language) — see [Vite SSR → Vocab / language chunks](#vocab--language-chunks). You still wrap the tree in `VocabProvider`.

**Webpack SSR:** call `addLanguageChunk` from your render params (this is not used for Vite SSR).

**Note:** Static rendering registers language chunks automatically.

**Example:** Using `addLanguageChunk` to set the language during webpack server-render

```jsx
export async function serverRender({ SkuProvider, addLanguageChunk, appPath }) {
  const language = getLanguageFromPath(appPath);
  addLanguageChunk(language);
  return renderToString(
    <SkuProvider>
      <StaticRouter location={appPath}>
        <VocabProvider language={language}>
          <App />
        </VocabProvider>
      </StaticRouter>
    </SkuProvider>,
  );
}
```

## Development server entrypoint

When developing your application sku will start two services:

- A dev server responsible for serving static assets
- An SSR service running your app's server code

The dev server acts as a single entrypoint for your development environment, proxying requests to your SSR service that don't match any other known routes.
This simulates a typical production environment, where a reverse proxy directs asset, API or other requests to another service.
It also avoids the need to complete Cross-Origin Resource Sharing (CORS) checks when making requests from the client.

To include other requests, like typical API traffic, consider using [Dev Server Middleware] to proxy requests.

[Dev Server Middleware]: ./docs/extra-features?id=devserver-middleware
