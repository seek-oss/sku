## Why

Managed Data Mode tells apps to put head and SEO in the route tree as React document metadata.
Sku’s Document wraps `<html>`, so `<head>` sits above the root layout and cannot see app providers.
Forge inline `@font-face` and other non-hoistable head nodes need those providers.

Apps should render `<html>` / `<head>` / `<body>` so they control the head.
Sku must still inject CSS and `modulepreload`.

## What Changes

- The root layout renders `<html>`, `<head>`, and `<body>`.
- Sku stops wrapping a sku-owned `<html>` around the router.
- Sku mounts document stylesheet and `modulepreload` links in its own tree (`precedence` on stylesheets) so React hoists them into the app `<head>`.
- Hoistable route-tree metadata stays the path for `<title>`, `<meta>`, and `<link>`.
- Non-hoistable tags go in the root layout `<head>` under providers that wrap `<html>`.
- The SSR template nests `ErrorBoundary` on an inner route so a boundary does not drop `<html>`.

## Non-goals

- A public document-asset component or app `Document` helper.
- A dual-entry `getDocumentHead` getter.
- String `renderDocument` templates.
- Switching Managed Data Mode to React Router Framework Mode.
- Vocab (`languages`, `getLanguage`, `VocabProvider`, `mapRoutePath`, `@vocab/react`) in the create template.
- A HTML-string-to-React head adapter in the create template.
- Development warnings for missing `<html>`, missing sku asset hrefs, or `ErrorBoundary` on the html route (see `document-head-error-warnings`).
- Braid `linkComponent` / `usePreloadRoute` in the create template (see `ssr-create-link-preload`).

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `managed-data-mode`: The root layout renders the Document element tree. Sku provides asset URLs and hoists them.
- `ssr`: Stream and hydrate the app’s `<html>`. Docs and the SSR template teach the root layout and inner error boundary.

## Impact

- SSR Document mount, `ssr-client` hydrate tree, and `sku/runtime`.
- SSR create template and fixtures.
- SSR product and migrating docs.
- Sku minor changeset.
