## MODIFIED Requirements

### Requirement: Docs cover root-layout document

SSR product docs MUST show a root layout that renders `<html>`, `<head>`, and `<body>`.

Docs MUST state that app providers that head nodes need MUST wrap `<html>`.

Multi-language docs MUST show `VocabProvider` wrapping `<html lang>` when locale is in the path, not wrapping only `<Outlet />`.

Docs MUST state that hoistable tags (`<title>`, `<meta>`, `<link>`, and `<style href precedence>`) still work from anywhere in the route tree.

Docs MUST state that non-hoistable nodes belong in the root layout `<head>`.

Docs MUST state that `ErrorBoundary` on the route that renders `<html>` replaces that layout.

Docs MUST recommend a child-route `ErrorBoundary` for page failures so the flushed document shell stays mounted.

Docs MUST state that an `ErrorBoundary` on the html route is allowed when the fallback renders a full `<html>` document.
That fallback covers failures before sku pipes the document shell.

Docs MUST state that `useInsertHtml` is for streaming data transports, not for Document head.

Migrating docs MUST replace “the Document shell is not overridable” with this contract.
Apps that interpolated tags into `renderDocument` put hoistable SEO in the route tree and non-hoistable tags in the root layout `<head>`.

Getting-started docs MUST describe the root layout as rendering `<html>`, `<head>`, and `<body>`.
Docs MUST NOT claim sku renders the HTML document element tree.

#### Scenario: Multi-language docs wrap html with VocabProvider

- **WHEN** a reader opens SSR multi-language docs
- **THEN** the root-layout example wraps `<html>` with `VocabProvider`
- **AND** `<html>` sets `lang` from that language
- **AND** the example does not wrap only `<Outlet />`

#### Scenario: Providers docs show html in the root layout

- **WHEN** a reader opens SSR providers docs
- **THEN** the tree is `SkuProvider` → router → root layout `<html>`
- **AND** docs state that sku hoists stylesheet and modulepreload links

#### Scenario: Migrating docs drop Document-not-overridable

- **WHEN** a reader opens SSR Migrating docs
- **THEN** docs tell apps to render `<html>` in the root layout
- **AND** docs tell apps to nest `ErrorBoundary` under that layout for page failures
- **AND** docs state that an html-route `ErrorBoundary` is allowed when the fallback renders a full `<html>` document
- **AND** docs do not say the Document shell is not overridable
