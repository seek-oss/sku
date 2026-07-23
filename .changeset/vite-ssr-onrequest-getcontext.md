---
'sku': minor
---

**Experimental BREAKING:** Vite SSR `onRequest` now receives Express `{ req }` only (previously Fetch `{ request }`). Optional dual-entry `getContext` seeds React Router loader/action context.

`onRequest` is called with the Express request **after** consumer middleware so AppWrapper / shell DI can read middleware-attached state (`req.user`, logger, etc.). Fetch `Request` remains on `query()` / loaders and optional server `getContext({ request, req })`.

Optional `getContext` on server and client entries (separate from `onRequest` / `onHydrate`) wires into `query(..., { requestContext })` and `createBrowserRouter({ getContext })`. Omit either export for previous empty/default context behaviour.

**Do not** put Express `req` into `RouterContextProvider` — project isomorphic values both sides can supply.

Docs: [Request entries](https://seek-oss.github.io/sku/#/./docs/ssr/entries), [Data loading](https://seek-oss.github.io/sku/#/./docs/ssr/data-loading), [Middleware](https://seek-oss.github.io/sku/#/./docs/ssr/middleware).
