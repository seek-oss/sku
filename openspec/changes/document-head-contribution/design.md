## Context

See proposal.md for why.

## Goals / Non-Goals

**Goals:**

- Stream and hydrate an `<html>` the root layout renders.
- Let app providers wrap `<html>` so non-hoistable head nodes see locale and site.
- Keep sku-owned CSS and `modulepreload` in the React tree on both sides without a consumer component.

**Non-Goals:**

- A public document-asset component / `Document` / `documentRoute`.
- Development warnings for missing `<html>`, missing sku asset hrefs, or `ErrorBoundary` on the html route (see `document-head-error-warnings`).
- Auto-throw in production.
- React Router Framework Mode.
- Buffering the production stream to inspect HTML.
- Vocab in the create template.
- Braid `linkComponent` / `usePreloadRoute` in the create template (see `ssr-create-link-preload`).

## Decisions

### Root layout renders `<html>`

```
InsertHtmlProvider
  DocumentAssetLinks      ← sku, private; stylesheet precedence="sku" + modulepreload
  SkuProvider
    Router
      RootLayout          ← app: may wrap html
        html
          head            ← app tags; sku links hoist here
          body
            Outlet
```

### Sku hoists assets

`DocumentAssetLinks` is private (`#runtime/documentAssets`).
Stylesheets use `rel="stylesheet"` + `href` + `precedence="sku"` so React hoists them into the app `<head>` on SSR and hydrate.
`modulepreload` hoists as a normal `<link>`.
Dev virtual CSS still sets `data-ssr-css`.

Charset, viewport, and `html lang` come from the app.

### Inner ErrorBoundary

The template nests `ErrorBoundary` on a child of the html route.
Docs warn. Sku does not export a route helper in this change.

## Risks / Trade-offs

- [App omits `<html>`] → Stream is not a document. Hydrate breaks. Template + docs. Follow-up warnings in `document-head-error-warnings`.
- [Hoisting fails / no head] → Unstyled document. Template + docs. Follow-up warnings in `document-head-error-warnings`.
- [ErrorBoundary on html route] → Failure HTML has no `<html>`. Template nests the boundary. Docs warn.
- [`data-ssr-css` stripped by React resources] → Dev HMR CSS may stick. Test that the attribute survives `precedence`.
- [React 18] → `precedence` is React 19. Vite SSR MDM uses the React 19 catalog.

## Migration Plan

Existing MDM apps move `<html>` into the root layout and move `ErrorBoundary` off the html route.
Hoistable metadata stays in the tree.
Non-hoistable tags go in that `<head>`, under providers that wrap `<html>`.
