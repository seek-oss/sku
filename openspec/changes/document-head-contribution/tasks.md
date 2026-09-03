## 1. HeadAssets runtime

- [x] 1.1 Add a `#runtime` HeadAssets module (provider + `HeadAssets` component) with the same published identity pattern as `useInsertHtml`
- [x] 1.2 Export `HeadAssets` from `sku/runtime` (not the provider)
- [x] 1.3 Emit CSS and `modulepreload` links, including `data-ssr-css` on the dev virtual stylesheet href

## 2. Drop sku Document html

- [x] 2.1 Stop wrapping `createDocumentAttempt` and `ssr-client` in sku `Document`
- [x] 2.2 Mount HeadAssets provider + `SkuProvider` + router only
- [x] 2.3 Remove or slim `Document.tsx` so sku no longer owns `<html>`

## 3. Template and fixtures

- [x] 3.1 SSR create template: `RootLayout` renders `<html>`, charset/viewport, `HeadAssets`, and `<body>`; `ErrorBoundary` on a child route
- [x] 3.2 Update MDM SSR fixtures and sku SSR unit/stream tests to use a root layout that renders `<html>` and `HeadAssets`

## 4. Tests

- [x] 4.1 Cover SSR HTML: root-layout `<html>`, `HeadAssets` links inside `<head>`, no wrapping sku `<html>`
- [x] 4.2 Cover a non-hoistable `<style>` in `<head>` under an app provider that wraps `<html>`
- [x] 4.3 Cover omit `HeadAssets` (no throw, no sku CSS links) and a child-route `ErrorBoundary` that keeps `<html>`

## 5. Docs and release

- [x] 5.1 Rewrite providers tree, runtime API, getting-started, and Migrating docs (root-layout document, `HeadAssets`, inner `ErrorBoundary`, drop “Document shell is not overridable”)
- [x] 5.2 Add a sku minor changeset and a create patch changeset
