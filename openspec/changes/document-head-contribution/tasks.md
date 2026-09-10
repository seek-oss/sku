## 1. Sku-hoisted document assets

- [x] 1.1 Private `#runtime` asset module (`DocumentAssetLinks`)
- [x] 1.2 Emit CSS with `precedence="sku"` and `modulepreload` links, including `data-ssr-css` on the dev virtual stylesheet
- [x] 1.3 Mount `DocumentAssetLinks` beside the router on stream and hydrate

## 2. App-owned html

- [x] 2.1 Stop wrapping `createDocumentAttempt` and `ssr-client` in sku `Document`
- [x] 2.2 Template and fixtures render `<html>` / `<head>` / `<body>`
- [x] 2.3 `ErrorBoundary` on a child of the html route

## 3. Tests and docs

- [x] 3.1 Cover sku links in app `<head>` with `precedence`, no wrapping sku `<html>`
- [x] 3.2 Cover non-hoistable `<style>` in `<head>` under a provider that wraps `<html>`
- [x] 3.3 Cover child-route `ErrorBoundary` keeps `<html>`
- [x] 3.4 Docs: root-layout document, sku-hoisted assets, inner `ErrorBoundary`
- [x] 3.5 Sku minor + create patch changesets
- [x] 3.6 Multi-language docs show `VocabProvider` wrapping `<html>` (template stays Vocab-free)
