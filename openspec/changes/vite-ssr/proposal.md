## Why

Vite SSR is disabled today.

Webpack SSR’s low-level `renderCallback` + string document + `#app` hydrate cannot stream Suspense HTML.

It also cannot let React own `<html>`/`<head>`/`<body>`.

This change adds a Vite-only SSR mode with React Router Data Mode, full-document streaming, and modern CSP headers.

It ships **experimental** (not for production).

## What Changes

- Vite-only SSR via `buildType: 'ssr' | 'static'` (experimental): `sku start` / `sku build`; not webpack style `-ssr`.
- Dual-entry React Router Data Mode contract (`routes`, `onRequest` / `middleware`, `onHydrate`); sku owns Document, streaming, assets, and CSP headers.
- `onRequest` receives Express `req` so AppWrapper / shell DI can read middleware-attached state (logger, auth, etc.).
- Optional dual-entry `getContext` exports (server + client) seed React Router `RouterContextProvider` for loader/action DI on document SSR and client navigations.
- Docs: prefer AppWrapper + Suspense for page content; document `getContext` as opt-in; red warning against putting Express `req` (or other non-isomorphic platform objects) into router context.
- Create template `vite-ssr` plus product and Migrating docs.
- Shared Express 4 server runtime; React Router 8 as an optional peerDependency `^8` for Vite SSR consumers.
- **BREAKING** (policy for later releases): bumping the Express or React Router major that Vite SSR integrates may be a breaking change.

Out of scope for this change (details in `design.md`): webpack SSR / create-template backfill, static `vite` template conversion, Framework Mode / RSC, Express 5, absolute/`CDN` `publicPath`, first-class router basename, Vite SSR `serverPort`, config `public` assets folder, `dangerouslySetViteConfig`, Jest support for React Router 8, making Express `req` the loader `request` argument, shipping Framework Mode server-only `getLoadContext(req, res)` as the sole API, passing Fetch `Request` into `onRequest`, passing `res` into `onRequest` / `getContext`, and treating raw Express `req` in `RouterContextProvider` as a supported pattern.

## Capabilities

### New Capabilities

- `vite-ssr`: Vite SSR lifecycle — `buildType`, dual-entry `routes` + request entries, streaming Document, chunks, create template, product + Migrating docs.
- `vite-ssr-csp`: Shell-derived CSP headers, lazy single nonce, optional report-only.

### Modified Capabilities

- (none — bundler/command constraints for this mode live under `vite-ssr`)

## Impact

- **Public API:** `buildType`; single `port` (no `serverPort`); required entry named exports; ALS CSP nonce; server `language` for Document vocab; `onRequest({ req })` (Express only; **BREAKING** vs prior Fetch `{ request }`); `onHydrate({ context })`; optional server/client `getContext` → RR `requestContext` / `createBrowserRouter({ getContext })`; create template `vite-ssr`; reused `devServerMiddleware`.
- **Deps:** `react-router` optional peer `^8`; Express 4 shared with webpack SSR (no 4 → 5 bump).
- **Docs / release:** Product + Migrating docs; related config/CSP/Vite docs; data-loading hierarchy + red warning against `req` in context; Data Mode dual `getContext` patterns (including client-nav ≠ initial SSR location); experimental warning + changeset; Express 5 deferred.
- **Fixtures/tests:** Vite SSR fixture (streaming, CSP, entries, chunks, vocab, relative `publicPath`); translations adapters; create template tests; config edge cases validation-only.
- **Adopt:** Opt-in via `buildType`; document hydrate; relative asset-only `publicPath`; no `public` folder / `dangerouslySetViteConfig`; shared `__sku_alias__*` entries; webpack-aligned production defines where they overlap.
