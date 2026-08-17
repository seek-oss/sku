## Why

When using Vite, SSR is disabled today.
Webpack SSR’s low-level `renderCallback` + string document + `#app` hydrate cannot stream Suspense HTML.
It also cannot let React own `<html>`/`<head>`/`<body>`.

This change introduces **Managed Data Mode**.
Sku owns Document, streaming/hydration, the Node server, and CSP.
Sku wires React Router Data Mode for routing and data.
Apps own routes, data, and providers.

Managed Data Mode is first shipped as **SSR** (`buildType: 'ssr'`).
The same contract is intended to be shareable later by a new Static path.
That contract includes `sku/runtime`, request entries, and typed context hooks.
Render strategy (`ssr` / `static`) and the Managed Data Mode API are separate concerns.
It ships **experimental** (not for production).

Multi-site apps need different path sets per site.
A single unfiltered route list either over-matches or registers foreign paths on every host.
This change makes site-scoped trees and automatically expanded paths for multi-language support first-class.
Details: `design.md` Decisions 4a and 4c.

With Express `req` on entry getters / optional `getRouterContext`, apps have no need to separate server vs client route modules.
A single `routesEntry` is the source of truth for both graphs.

Streaming data transports must inject `<script>` chunks between React stream chunks.
That lets SSR queries hydrate the browser cache instead of refetching.
Apollo Client streaming hydration is the main adoption case.
Sku owns the stream pipe.
Apps cannot reach it.
Sku opens one seam (`useInsertHtml`).
The transport itself stays with the app.
Details: `design.md` Decision 21a.

Pass-through app `Providers` that only re-piped `site` / `clientContext` proved awkward in fixtures.
Sku always mounts `SkuProvider` and exposes typed hooks via `createSkuContexts`.
Env-differing values come from dual-entry `getReactContext`.
Isomorphic mounts (Apollo, Vocab) live in the app’s root layout route.
Details: `design.md` Decision 12a.

## What Changes

- Experimental SSR ships with Vite `buildType: 'ssr'`.
- `buildType: 'static'` keeps today’s static Vite behaviour.
- A future Managed Data Mode Static path is out of scope for this change.
- Commands are `sku start` / `sku build`.
- Webpack-style `-ssr` is not used.
- First-class `routesEntry` defaults to `src/routes.tsx`.
- It exports named `routes` with optional `sites`.
- Optional `mapRoutePath` maps one logical path to per-site concrete paths during tree pre-build.
- Sku pre-builds per-site trees.
- Apps resolve the site via `getSite` when multi-site.
- Config `routes` (static prerender paths) stays separate.
- Request entries (`serverEntry` / `clientEntry`) default-export objects via `defineServerEntry` / `defineClientEntry`.
- Optional getters include `getSite`, `getLanguage`, `getClientContext`, and `getReactContext`.
- Optional entry hooks include `middleware`, `onListen`, `onHydrate`, and dual-entry `getRouterContext`.
- Sku owns Document, streaming, assets, CSP, and always-on `SkuProvider` outside the router.
- There is no app-authored dual-entry `Providers`.
- Three value channels replace it: `getClientContext`, `getReactContext`, and `getRouterContext`.
- Typed hooks come from `createSkuContexts` on `sku/runtime`.
- Router-aware wrapping lives in the app’s root layout route.
- `useInsertHtml()` on `sku/runtime` supports app-owned streaming data transports.
- It is a no-op off the SSR path.
- Optional server-entry `onListen` covers the webpack `onStart` window.
- Opt-in config `expressTrustProxy` is a boolean that sets Express hop count `1`.
- The create template sets `expressTrustProxy: true`.
- Docs describe **Managed Data Mode** as the API and **SSR** as the render strategy.
- They cover multi-site routing, the three value channels, and an Apollo streaming walkthrough.
- Create template `ssr` ships with product and Migrating docs.
- SSR uses the same Express 4 server runtime.
- React Router 8 becomes an optional peer `^8` that is required for SSR consumers.
- Later major bumps of Express or React Router that SSR integrates may be breaking.

Out of scope includes webpack SSR backfill, Framework Mode / RSC, Express 5, absolute/`CDN` `publicPath`, app-authored `Providers`, and sku-owned Apollo.
Related items are deferred too.
Full list: `design.md` Non-Goals.

## Capabilities

### New Capabilities

- `managed-data-mode`: App contract shared by SSR today and a future Static path. Covers naming, `sku/runtime`, `routesEntry` (including optional `mapRoutePath`), request entries, `SkuProvider` / `createSkuContexts`, `useInsertHtml`, intent preload, and the React Router 8 optional peer.
- `ssr`: SSR render strategy and ship surface. Covers `buildType`, streaming Document, Express server, build layout, create template `ssr`, config rejects, and product / Migrating docs.
- `csp`: SSR CSP delivery only (headers, shell-derived policy, lazy single nonce, report-only, report-to). Does not backfill static or webpack CSP behaviour.

### Modified Capabilities

- (none)

The OpenSpec change / branch name remains `vite-ssr` as a historical workstream id only.

## Impact

**Public API**

- `buildType`
- `routesEntry` and request entries via `defineServerEntry` / `defineClientEntry`
- `sku/runtime` hooks: `createSkuContexts`, `useInsertHtml`, `usePreloadRoute`, `getCspNonce`
- `sku/runtime` types: `SkuRouteObject<Site>`, `SiteOf`, `MapRoutePath`
- `onListen` and `expressTrustProxy`
- create template `ssr`

Full contract: `design.md` Decisions 12 / 12a / 25 / 28.

**Deps**

- `react-router` is an optional peer `^8`.
- Express 4 stays shared with webpack SSR.
- There is no 4 → 5 bump in this change.

**Docs / release**

- Product and Migrating docs describe Managed Data Mode vs SSR.
- They cover multi-site, optional `mapRoutePath` for multi-path pages, the three value channels, and Apollo streaming.
- Deploy docs cover a self-contained production server and recommended external hosting of hashed assets.
- Release includes an experimental warning and a changeset.

**Fixtures / tests**

- SSR fixture covers streaming, CSP, multi-site, and hooks.
- `stream-insert-html` proves Apollo end to end.
- Coverage includes `onListen` and `expressTrustProxy`.
- Create template tests are included.
- Module identity is covered per Decision 26.

**Adopt**

- Adoption is opt-in via `buildType`.
- `publicPath` stays relative and asset-only.
- There is no `public` folder, `dangerouslySetViteConfig`, or `vitePlugins` for SSR.
