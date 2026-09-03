## Why

Managed Data Mode tells apps to put head and SEO in the route tree as React document metadata.
That covers hoistable tags such as `<link>` and `<meta>`.
It does not cover inline `<style>` with CSS children, so brand `@font-face` from `@seek/shared-web-assets` stays in `<body>`.

Sku’s Document owns `<html>`, so `<head>` sits above the root layout.
App providers for locale and site wrap body content only.
`<head>` cannot see them, and there is no supported way to put non-hoistable nodes in the streamed `<head>` on SSR and hydrate.

## What Changes

- The root layout owns `<html>`, `<head>`, and `<body>`.
- Sku stops wrapping a sku-owned `<html>` around the router.
- Apps wrap `<html>` with their own providers so head nodes see locale and site.
- Sku injects Document CSS and `modulepreload` through a `sku/runtime` component that reads assets from context.
- Hoistable route-tree metadata stays the path for `<title>`, `<meta>`, and `<link>`.
- The SSR template nests `ErrorBoundary` on an inner route so a boundary does not drop `<html>`.

## Non-goals

- A dual-entry `getDocumentHead` getter.
- A layout slot that sku reparents into `<head>`.
- String `renderDocument` templates.
- Switching Managed Data Mode to React Router Framework Mode.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `managed-data-mode`: The root layout owns the Document element tree. Sku still owns streaming, hydration, and asset URLs, exposed as a context-backed component.
- `ssr`: Stream and hydrate the app’s `<html>` instead of sku’s `Document` shell. Product docs and the SSR template teach the root layout and inner error boundary.

## Impact

- SSR `Document` mount, `ssr-client` hydrate tree, and `sku/runtime`.
- SSR create template and fixtures that assume a sku-owned `<html>`.
- SSR product and migrating docs (providers tree, Document-not-overridable wording, head/SEO).
- Sku minor changeset.
