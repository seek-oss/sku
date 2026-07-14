# Server rendering

Sku’s server-side rendering is **Vite SSR**: a high-level API on `bundler: 'vite'` + `renderType: 'server-side-rendered'`, built on [React Router Data Mode](https://reactrouter.com/start/modes#data). Sku owns the HTTP server, Document shell, streaming, hydration, and CSP headers. Use `sku start` / `sku build` (same as static Vite). Requires **React 19+**.

Scaffold with `pnpm dlx @sku-lib/create my-app --template vite-ssr`, or follow the sections below.

Migrating from a static app or from the older webpack SSR API? See [Migrating](#migrating). Existing webpack SSR apps (`sku start-ssr` / `sku build-ssr` / `renderCallback`) remain supported for continuity — see [Older webpack SSR](#older-webpack-ssr-supported-for-continuity). New apps should not start on that path.

## Vite SSR

### Scaffold a new app

```sh
pnpm dlx @sku-lib/create my-app --template vite-ssr
cd my-app
pnpm start
```

The `vite-ssr` template scaffolds `bundler: 'vite'`, `renderType: 'server-side-rendered'`, a relative `publicPath`, and the required named exports (`routes`, `onRequest`, `middleware`, `onHydrate`) at the default entry paths. Interactive create also offers **Vite SSR** as a distinct choice from static **Vite**.

### React Router Data Mode

Vite SSR largely wraps [React Router Data Mode](https://reactrouter.com/start/modes#data). You export a named `routes` (`RouteObject[]`) from `routesEntry`; sku owns the HTTP server, document shell, streaming, and hydration, and wires that route config into React Router on the server and in the browser. Loaders, actions, lazy routes, nested layouts, and error boundaries are standard Data Mode APIs.

For information on how to use React Router to register routes, see [React Router Data Mode](https://reactrouter.com/start/data/routing).

Configure:

```ts
import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  renderType: 'server-side-rendered',
  routesEntry: 'src/routes.tsx', // default
  publicPath: '/', // relative only — absolute / CDN URLs are rejected
  port: 3000,
} satisfies SkuConfig;
```

Export named `routes` from `routesEntry`. Prefer co-locating each page in its own directory with a `route.ts` (path / lazy / loaders / handle) and the page module (e.g. `home.tsx`). Compose those route modules into an explicit `routes` array:

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
// src/routes.tsx
import type { RouteObject } from 'react-router';

import { homeRoute } from './pages/home/route.js';

export const routes: RouteObject[] = [
  {
    path: '/',
    children: [homeRoute],
  },
];
```

sku owns:

- the HTTP(S) server (dev: Vite `middlewareMode` + HMR on one port; prod: `node dist/server/server.js`)
- the React Document shell (`<html>` / `<head>` / `<body>` with CSS + modulepreload links) — not overridable; use React 19 metadata in routes/layouts for head/SEO
- full-document streaming with `renderToPipeableStream` (shell-first; set route `handle.waitForAll` to buffer until `onAllReady`)
- document-level hydration (`hydrateRoot(document, …)`), not `#app`
- CSP as HTTP headers when `cspEnabled` / `cspReportOnlyEnabled` are set (see [CSP](#csp))
- forwarding React Router loader/action headers onto streamed HTML responses (see [Response headers](#response-headers))

`httpsDevServer: true` is supported for Vite SSR `sku start`.

### Request entries (`serverEntry` / `clientEntry`)

Required separate modules via the existing `serverEntry` / `clientEntry` keys (defaults `src/server.tsx` / `src/client.tsx`; path may be `.ts` / `.tsx` / `.js`) for per-request composition and server-only middleware. Under Vite SSR these use **named exports** — they do **not** own the HTML response (sku still streams Document + CSP) and are not a static `#app` hydrate entry. Missing entry files or any required named export is a **hard error**; sku does not use `default` or supply noop stubs.

**Server entry** must export:

- `onRequest` — runs before React Router `query()`; may return `AppWrapper`, `language`, and/or `clientContext` (see [App-level providers](#app-level-providers-appwrapper))
- `middleware` — Connect/Express handlers mounted before the HTML render path (see [Middleware](#middleware))

**Client entry** must export:

- `onHydrate` — receives `{ context, language }` and may return `AppWrapper`

```tsx
// src/server.tsx
import type { SkuSsrMiddleware, SkuSsrOnRequest } from 'sku';

import { Providers } from './App/Providers';

export const onRequest: SkuSsrOnRequest = ({ request }) => ({
  language: resolveLocaleFromRequest(request), // e.g. 'th-TH'
  clientContext: { theme: 'dark' },
  AppWrapper: Providers,
});

export const middleware: SkuSsrMiddleware = [];
```

```tsx
// src/client.tsx
import type { SkuSsrOnHydrate } from 'sku';

import { Providers } from './App/Providers';

export const onHydrate: SkuSsrOnHydrate = () => ({
  AppWrapper: Providers,
});
```

### App-level providers (`AppWrapper`)

`AppWrapper` is a React component `ComponentType<{ children }>` for **providers / request-scoped seed only** — not page layout or Document chrome. Sku mounts it **inside** the router as a pathless parent layout so it may use React Router hooks (`useLocation`, `useParams`, etc.).

Render tree:

```
Document
  └── RouterProvider / StaticRouterProvider
        └── sku pathless layout   ← AppWrapper (if returned) + Outlet
              └── consumer routes
```

When `AppWrapper` is omitted, consumer routes are used as-is. Use the same providers on server and client so the tree matches for hydration. Values that change on SPA navigations must re-derive via React Router hooks inside `AppWrapper` (or a route layout); closing only over hydrate `context` / `language` will go stale.

`onRequest` may also return:

- `language` — configured language **name** (or `en-PSEUDO`) for vocab chunk identity
- `clientContext` — JSON-serialisable shell seed (serialised at shell time only; forwarded to `onHydrate` as `context`)

A consumer root `ErrorBoundary` does **not** catch errors thrown while rendering `AppWrapper` itself (the injected parent sits above consumer routes).

```tsx
import { VocabProvider } from '@vocab/react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router';
import type { SkuSsrOnRequest } from 'sku';

export const onRequest: SkuSsrOnRequest = ({ request }) => {
  const language = resolveLocaleFromRequest(request);

  return {
    language,
    AppWrapper: ({ children }: { children: ReactNode }) => {
      const { pathname } = useLocation();
      const activeLanguage = resolveLocaleFromPathname(pathname) ?? language;
      return (
        <VocabProvider language={activeLanguage}>{children}</VocabProvider>
      );
    },
  };
};
```

### Middleware

Put request middleware on the server entry’s named `middleware` export (`SkuSsrMiddleware`: a Connect/Express-compatible handler or array). Empty array / passthrough is fine. Middleware is mounted **before** Vite middlewares and the HTML render path; it must not commit the document body.

Do **not** put Vite SSR app middleware on:

- the routes entry
- config `devServerMiddleware` (that remains for static-app proxy helpers — see [Dev Server Middleware](./docs/extra-features?id=devserver-middleware))

```tsx
import type { SkuSsrMiddleware } from 'sku';

export const middleware: SkuSsrMiddleware = (req, res, next) => {
  if (req.path === '/api/health') {
    res.status(200).type('text/plain').send('ok');
    return;
  }
  next();
};
```

### CSP

When `cspEnabled` and/or `cspReportOnlyEnabled` are set, Vite SSR delivers CSP as **HTTP headers** (`Content-Security-Policy` / `Content-Security-Policy-Report-Only`) derived from the document shell plus nonces and hashes of bootstrap scripts. Meta `http-equiv` CSP is **not** used on the Vite SSR path.

Vite SSR uses **at most one** request-scoped nonce per HTML response, minted only when explicitly requested (`getCspNonce()` from `sku`, or `req.getCspNonce()` in middleware).

Relative `publicPath` only — see [CSP](./docs/csp.md) and [Configuration](./docs/configuration.md) for report-only options (`cspReportOnlyReportTo`, extra script hosts, etc.).

### Response headers

After React Router `query()`, when sku streams HTML (not a short-circuit `Response` such as a redirect), it forwards loader/action headers from the route context onto the Express response (including multi-value headers such as `Set-Cookie`), then applies sku-owned headers (`Content-Type`, CSP).

Set caching and cookies from loaders/actions with React Router’s `data()` / header APIs, for example:

```tsx
import { data } from 'react-router';

export async function loader() {
  return data(
    { ok: true },
    {
      headers: {
        'Cache-Control': 'private, max-age=0',
        'Set-Cookie': 'session=1; Path=/; HttpOnly',
      },
    },
  );
}
```

### Document hydration

sku hydrates the **full document** with `hydrateRoot(document, …)` — there is no `#app` mount node and no consumer `renderDocument` / static `render.tsx` on this path. Prefer React 19 document metadata in routes/layouts for `<head>` / SEO. The Document shell itself is not overridable.

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

Do **not** statically import those page modules into `routesEntry` or `route.ts` — that eagerly bundles them and defeats per-route chunking. Import only the route configs. The `fixtures/vite-ssr` app demonstrates this pattern with distinct `about` and `details` chunks.

**Escape hatch:** set `handle.moduleId` explicitly to the Vite client manifest key (usually the source path, e.g. `src/pages/about/about.tsx`) when you need a custom key or a non-idiomatic `lazy` shape. An explicit value is never overwritten.

sku does **not** guess for non-idiomatic shapes (no injection):

- granular `lazy: { Component: … }`
- lazy functions with multiple `import()` calls
- indirect bindings (`lazy: loadAbout`)

In development, sku warns when a lazy route still has no effective `moduleId` after transform, or when a provided `moduleId` is not found in the client manifest.

### Vocab / language chunks

When `languages` is configured, Vite SSR keeps `@vocab/vite` language chunk splitting and registers the active language chunk (`en-translations`, …) on the Document asset path (same idea as static Vite).

sku resolves the language from (in order):

1. **Server request entry `language` (preferred / only app-owned path)** — return a configured language **name** (e.g. `th-TH`), not necessarily a URL segment. Loaders/actions may read it with `getSkuLanguage()` from `sku` after the server entry has run.
2. the sole configured language when only one language is set

If the language cannot be resolved (or the server entry returns an unknown name), sku soft-fails: it skips vocab chunk registration and does not error the response.

sku does **not** identify language from Express `req.skuLanguage`, a `:language` route param, or route `handle.language`. Compose locale in the server entry (middleware may still parse URLs for redirects, but must not set a parallel language slot).

```tsx
// src/server.tsx
import type { SkuSsrOnRequest } from 'sku';

export const onRequest: SkuSsrOnRequest = ({ request }) => ({
  // Must match a name from sku config `languages` (or `en-PSEUDO`)
  language: resolveLocaleFromRequest(request), // e.g. 'th-TH'
});
```

Wrap your UI in `VocabProvider` via `AppWrapper` (see [App-level providers](#app-level-providers-appwrapper)) or a layout. URL path segments like `/en/hello` are fine for routing — identify vocab language in the server entry from that URL (or cookies/headers), not by relying on sku to read `:language`.

### Multiple paths per page / languages in path

Some URL schemes serve the same page at more than one path — for example `/about` for a default language and `/fr/about` when the language is nested in the path.

React Router Data Mode matches on the full path and does not let one route definition declare multiple paths. Define the page once, then register a separate route object for each path that should serve it:

```tsx
// src/pages/page/route.ts
import type { RouteObject } from 'react-router';

const route = {
  lazy: () => import('./page.js'),
} satisfies Omit<RouteObject, 'path'>;

export const aboutRoutes: RouteObject[] = [
  { ...route, path: 'page' },
  { ...route, path: 'fr/page' },
];
```

Be careful using dynamic params such as `:lang`. A dynamic segment would match unsupported prefixes and the server would respond on routes you do not intend to support; listing only supported prefixes means unknown ones fall through as not found.

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
// src/routes.tsx — attach ErrorBoundary on the root route
import type { RouteObject } from 'react-router';

import { ErrorBoundary, RootLayout } from './RootLayout.js';
import { homeRoute } from './pages/home/route.js';

export const routes: RouteObject[] = [
  {
    path: '/',
    Component: RootLayout,
    ErrorBoundary,
    children: [homeRoute],
  },
];
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

## Migrating

### Migrate from Static App

High-level guide for moving a **static** sku app (webpack or Vite SSG) to Vite SSR. For day-to-day API detail, prefer the [Vite SSR](#vite-ssr) sections above.

#### Requirements

- Upgrade to **React 19+** before migrating (document hydration requires it)
- Vite SSR is Vite-only: `bundler: 'vite'` + `renderType: 'server-side-rendered'`
- Use a **relative** `publicPath` (e.g. `/`) — absolute / CDN URLs are not supported

#### Limitations

This guide covers the **sku** surface only (config, entries, providers, middleware, CSP, headers, hydration). Infrastructure, deployments, process managers, and reverse-proxy setup are out of scope.

#### Config and commands

- Set `bundler: 'vite'` and `renderType: 'server-side-rendered'`
- Prefer scaffolding with `pnpm dlx @sku-lib/create my-app --template vite-ssr`, or mirror that config
- Use `sku start` / `sku build` (same commands as static Vite) — do **not** introduce `start-ssr` / `build-ssr`
- Drop static-only config such as `renderEntry` / `src/render.tsx` and environments-driven static HTML generation for the SSR path

#### Routes and request entries

- Replace the static page + `render.tsx` / `#app` client with a `routesEntry` exporting named `routes` (`RouteObject[]`)
- Add required `serverEntry` / `clientEntry` with named `onRequest`, `middleware`, and `onHydrate` (hard error if missing)
- Prefer idiomatic `lazy: () => import('./pages/…')` on route configs for per-route chunks

#### App-level providers

- Move app-wide providers (Braid, Vocab, etc.) into `AppWrapper` returned from `onRequest` / `onHydrate` — not into a static `renderApp` / `#app` tree alone
- Keep server and client `AppWrapper` trees aligned for hydration; re-derive URL-scoped values with React Router hooks

#### Middleware

- Mount Connect/Express middleware on the server entry `middleware` export

#### CSP

- Enable `cspEnabled` / `cspReportOnlyEnabled` as needed — Vite SSR emits **HTTP header** CSP, not meta `http-equiv`
- Use the single request-scoped nonce (`getCspNonce` / `req.getCspNonce`); do not carry over static/webpack multi-`createUnsafeNonce` patterns

#### Response headers

- Set `Cache-Control`, `Set-Cookie`, etc. from React Router loaders/actions; sku forwards those headers onto streamed HTML responses
- Do not expect a consumer `renderDocument` / `res.send` HTML path

#### Document / hydration

- Replace `#app` `hydrateRoot` and `renderDocument` with sku’s full-document stream + `hydrateRoot(document)`
- Use React 19 metadata in routes/layouts for head/SEO; the Document shell is not overridable

### Migrate from Older SSR App

High-level guide for moving from the older **webpack-based SSR** (`sku start-ssr` / `sku build-ssr` / `renderCallback`) to the new Vite-based SSR.

The older SSR API was significantly lower-level and required apps to introduce a lot of their own bespoke behaviour. Because of this, migration will likely be dependent on your solution’s specifics.

#### Requirements

- Upgrade to **React 19+** before migrating
- Switch to `bundler: 'vite'` + `renderType: 'server-side-rendered'`
- Relative `publicPath` only

#### Limitations

Covers the **sku** migration surface only. Deploy/process/infra changes are out of scope beyond noting command and layout differences.

#### Config and commands

- Set `renderType: 'server-side-rendered'` and `bundler: 'vite'`
- Replace `sku start-ssr` / `sku build-ssr` with `sku start` / `sku build`
- Production becomes `node dist/server/server.js` (sibling `client/` + `server/` under the build target) — not webpack’s single `dist/server.js` layout
- `renderType` set means `-ssr` commands are rejected

#### Routes and request entries

- Replace webpack `serverEntry` default export `{ renderCallback, middleware, onStart }` with Vite SSR named exports: routes entry `routes`, server `onRequest` + `middleware`, client `onHydrate`
- Express `renderCallback` no longer owns HTML — sku streams Document; put providers in `AppWrapper`, data loading in React Router loaders/actions
- Optional webpack `onStart` is not part of the Vite SSR request-entry contract

#### App-level providers

- Move `SkuProvider` / app providers from `renderCallback` into `AppWrapper` on `onRequest` / `onHydrate`
- Vocab language identity moves from `addLanguageChunk` / path hacks to server entry `language` (see [Vocab / language chunks](#vocab--language-chunks))

#### Middleware

- Keep using a middleware export, but on the Vite SSR **server entry** named `middleware` (same Connect style)
- Webpack dual-port / proxy assumptions differ; Vite SSR is single-port in dev (`httpsDevServer` supported)

#### CSP

- Leave meta `http-equiv` / multi-`createUnsafeNonce` webpack patterns behind
- Use header CSP + the single request-scoped nonce APIs (`getCspNonce` / `req.getCspNonce`)

#### Response headers

- Prefer loader/action headers (`Set-Cookie`, `Cache-Control`, …) over manually setting headers on `res` inside `renderCallback` before `res.send`
- sku forwards loader/action headers onto the streamed HTML response

#### Document / hydration

- Drop hand-rolled HTML templates / `getHeadTags` / `getBodyTags` document assembly for the Vite SSR path
- Hydration is full-document (`hydrateRoot(document)`), not a partial mount inside markup you assembled in `renderCallback`

## Older webpack SSR (supported for continuity)

Previously, sku’s only SSR support was a low-level webpack API using `-ssr` commands (`sku start-ssr` / `sku build-ssr`) and a `serverEntry` default export with `renderCallback`. That path is **discouraged for new apps** — prefer [Vite SSR](#vite-ssr) above, or [migrate](#migrate-from-older-ssr-app).

It remains **supported for existing webpack SSR apps** for continuity and will eventually be deprecated.

Minimal config and server entry:

```ts
export default {
  clientEntry: 'src/client.tsx',
  serverEntry: 'src/server/server.tsx',
  public: 'src/public',
  publicPath: '/',
  target: 'dist',
  port: 3300,
  serverPort: 3301,
} satisfies SkuConfig;
```

Sku provides an [Express](https://expressjs.com/) server. The `serverEntry` default export may provide `renderCallback`, optional `middleware`, and optional `onStart`:

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

Commands (different from Vite SSR / static apps):

- `sku start-ssr` — development; uses both `port` and `serverPort`
- `sku build-ssr` — production assets; run with `node ./dist/server.js` (listens on `serverPort`)
- `sku test` — tests

### Multi-part response

To return HTML at different times in the request, use `flushHeadTags` for head tags added since the previous call (typically from dynamic chunks):

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

### Multi-language support

When using multiple languages the browser will download the language as needed, which can delay first paint. To ensure translations are available immediately, call `addLanguageChunk` from your render params (Vite SSR uses server-entry `language` instead — see [Vocab / language chunks](#vocab--language-chunks)):

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

Static rendering registers language chunks automatically.

### Development server entrypoint

On the older webpack SSR path, `sku start-ssr` starts two services:

- A dev server for static assets
- An SSR service running your app’s server code

The dev server is the single entrypoint and proxies non-asset requests to the SSR service (similar to a production reverse proxy, and avoiding CORS for client requests). Vite SSR uses a single port instead.

To proxy other traffic (for example APIs), use [Dev Server Middleware](./docs/extra-features?id=devserver-middleware).
