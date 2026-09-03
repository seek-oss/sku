## Context

See proposal.md for why.

Sku currently wraps every document in an internal `Document` that owns `<html>`, `<head>`, and `<body>`.
The router and root layout render only inside `<body>`.
Asset `<link>`s live in that sku `<head>`.
`hydrateRoot(document)` hydrates the same tree.

React context follows the tree.
App providers in the root layout cannot wrap sku’s `<head>`.

`useInsertHtml` still exists for streaming transports.
Its first flush is before `</head>`, but callbacks render with no app providers.

## Goals / Non-Goals

**Goals:**

- Stream and hydrate an `<html>` the root layout owns.
- Let app providers wrap `<html>` so non-hoistable head nodes see locale and site.
- Keep sku-owned CSS and `modulepreload` URLs in the React tree on both sides.

**Non-Goals:**

- React Router Framework Mode (`Layout` / `<Links />` / `<Scripts />` from `react-router`).
- Auto-injecting CSS without a component the app renders.
- Runtime failure when `HeadAssets` is omitted.
- Expanding CSP `font-src`.

## Decisions

### Root layout renders `<html>`

Stop wrapping the router in sku `Document`.
The root layout route MUST render `<html>`, `<head>`, and `<body>`.
Sku still mounts `InsertHtmlProvider` and `SkuProvider` outside the router.

```
InsertHtmlProvider
  HeadAssetsProvider     ← sku, asset URLs for this document
    SkuProvider
      Router
        RootLayout       ← app: providers may wrap html
          html
            head
              HeadAssets
              app tags
            body
              Outlet
```

`createDocumentAttempt` and `ssr-client` pass `children` of those providers into `StaticRouterProvider` / `RouterProvider` only.

Alternative: sku `Document` with a head slot.
Rejected because `<head>` still sits above the layout.
Alternative: Framework Mode `Layout` export.
Rejected as a non-goal.
The Data Mode equivalent is a parent route that renders `<html>` and an inner route that owns `ErrorBoundary`.

### `HeadAssets` from `sku/runtime`

Export `HeadAssets` as the consumer component.
It reads CSS and `modulepreload` URLs from a sku-mounted context and emits the same `<link>`s today’s `Document` puts in `<head>`.
Dev SSR CSS keeps `data-ssr-css` on the virtual stylesheet href.
Charset, viewport, and `html lang` stay in the app layout (template supplies them).

Do not name it `DocumentAssets`.
That identifier is already the internal URL bag type.

Do not fold asset URLs into `SkuProvider` / `createSkuContexts`.
Those hooks are site and request values, not document links.

Mount the provider via a private `#runtime/*` module with the same identity rules as `useInsertHtml`.
Public `sku/runtime` re-exports only `HeadAssets`.

Alternative: stream-inject asset tags before `</head>`.
Rejected because hydrate would not own the nodes.
Alternative: Next-style auto-injection with no component.
Rejected for this change.
Forgetting `HeadAssets` ships unstyled HTML.
The template and docs make the component required.
Sku does not throw.

### Inner `ErrorBoundary`, not on the html route

React Router replaces a route’s `Component` with its `ErrorBoundary`.
If `ErrorBoundary` sits on the route that renders `<html>`, a failure drops the document.

The SSR template and docs MUST put `ErrorBoundary` on a child route under the root layout.
A pathless child with `ErrorBoundary` and page children is enough.
The root layout stays mounted.

Root-layout throws and `SkuProvider` throws still fall through to Express.
That matches today’s “errors above the router” story.

### Fixtures and unit tests supply `<html>`

`render()` no longer emits a sku `<html>` for a page-only route.
SSR unit tests, stream tests, and fixtures MUST use a root layout that renders `<html>` and `HeadAssets`.

## Risks / Trade-offs

- [App omits `HeadAssets`] → Unstyled document. Template + docs. No throw.
- [App omits `<html>`] → Stream is not a document. `hydrateRoot(document)` breaks. Template + docs.
- [ErrorBoundary on the html route] → Failure HTML has no `<html>`. Template nests the boundary. Docs warn.
- [Existing experimental MDM apps] → Breaking layout change. Migrating docs. Minor changeset (API still experimental).

## Migration Plan

This change is Managed Data Mode only.
That path is Vite SSR today.
Webpack SSR and static are out of scope.

Existing MDM apps must move `<html>` into the root layout, render `HeadAssets` in `<head>`, and move `ErrorBoundary` to a child route.
Hoistable metadata stays in the tree.
Non-hoistable tags go in that `<head>`, under whatever providers wrap `<html>`.
