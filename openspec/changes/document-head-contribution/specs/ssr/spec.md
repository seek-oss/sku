## ADDED Requirements

### Requirement: Stream and hydrate the app html

Sku MUST stream `renderToPipeableStream` of the router tree without a sku-owned `<html>` wrapper.
The root layout’s `<html>` MUST be the document element on SSR and on `hydrateRoot(document)`.

Bootstrap scripts MAY still be passed to `renderToPipeableStream`.
`useInsertHtml` behaviour is unchanged.

#### Scenario: SSR HTML comes from the root layout

- **WHEN** the root layout renders `<html lang="en">` with a `<head>` and `<body>`
- **THEN** the streamed response contains that `<html>`
- **AND** sku does not wrap it in another `<html>`

#### Scenario: Hydrate uses the same tree

- **WHEN** the client hydrates
- **THEN** sku does not mount a sku-owned `<html>` around the router
- **AND** sku still hoists document CSS and modulepreload links from hydrate bootstrap assets

### Requirement: Docs cover root-layout document without HeadAssets

SSR product docs MUST show a root layout that renders `<html>`, `<head>`, and `<body>` without `HeadAssets`.

Docs MUST state that app providers that head nodes need MUST wrap `<html>`.

Multi-language docs MUST show `VocabProvider` wrapping `<html lang>` when locale is in the path, not wrapping only `<Outlet />`.

Docs MUST state that hoistable tags (`<title>`, `<meta>`, `<link>`, and `<style href precedence>`) still work from anywhere in the route tree.

Docs MUST state that non-hoistable nodes belong in the root layout `<head>`.

Docs MUST state that `ErrorBoundary` MUST NOT sit on the route that renders `<html>`.

Docs MUST state that `useInsertHtml` is for streaming data transports, not for Document head.

Migrating docs MUST replace “the Document shell is not overridable” with this contract.
Apps that interpolated tags into `renderDocument` put hoistable SEO in the route tree and non-hoistable tags in the root layout `<head>`.

Getting-started docs MUST NOT claim sku owns the HTML document element tree.

#### Scenario: Multi-language docs wrap html with VocabProvider

- **WHEN** a reader opens SSR multi-language docs
- **THEN** the root-layout example wraps `<html>` with `VocabProvider`
- **AND** `<html>` sets `lang` from that language
- **AND** the example does not wrap only `<Outlet />`

#### Scenario: Providers docs show html in the root layout

- **WHEN** a reader opens SSR providers docs
- **THEN** the tree is `SkuProvider` → router → root layout `<html>`
- **AND** docs state that sku hoists stylesheet and modulepreload links
- **AND** the example does not render `HeadAssets`

#### Scenario: Migrating docs drop Document-not-overridable

- **WHEN** a reader opens SSR Migrating docs
- **THEN** docs tell apps to render `<html>` in the root layout
- **AND** docs do not tell apps to render `HeadAssets`
- **AND** docs tell apps to nest `ErrorBoundary` under that layout
- **AND** docs do not say the Document shell is not overridable

## MODIFIED Requirements

### Requirement: Teams can scaffold an SSR app via create

`@sku-lib/create` MUST offer a template with id `ssr`.

#### Scenario: Create ssr template

- **WHEN** a user runs `@sku-lib/create --template ssr`
- **THEN** the project is SSR with `expressTrustProxy: true` and `routesEntry` exporting named `routes`
- **AND** config `sites` may be omitted or declare real site names
- **AND** the server entry exports `middleware` (and may export `onListen` / context getters)
- **AND** the client entry exports `onHydrate` (and may export context getters)
- **AND** the template wires `createSkuContexts` in `src/skuContext.ts` and has no `Providers` export
- **AND** the template has `src/RootLayout.tsx` and no `src/App/` directory
- **AND** `RootLayout` renders `<html>`, `<head>`, and `<body>` without `HeadAssets`
- **AND** `ErrorBoundary` is on a child route under that layout, not on the html route
- **AND** the home page calls `useSite()` (and does not use `import.meta.env` for site/environment demo)
- **AND** a 0–1 site template omits `getSite`
- **AND** a 0–1 site template keeps unparameterized `SkuRouteObject[]`
- **AND** request entries do not re-export `routes`
- **AND** lazy page modules export named `Component`
- **AND** the template does not depend on Vocab
- **AND** can `sku start` without further entry setup

#### Scenario: Create template is ssr

- **WHEN** a user scaffolds an SSR app with `@sku-lib/create`
- **THEN** the template id is `ssr`

#### Scenario: Static vite create template unchanged

- **WHEN** a user creates a project with the existing `vite` template
- **THEN** it is not configured as `buildType: 'ssr'` by default
