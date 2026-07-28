# Docs Site

## Purpose

How the sku docs site publishes URLs without a `/docs` prefix and redirects legacy `/sku/docs/` paths and docsify hash routes.

## Requirements

### Requirement: Docs URLs without `/docs` prefix

The docs site SHALL publish content without a `/docs` URL prefix (VitePress `srcDir: 'docs'`; e.g. `site/docs/support.md` → `/support`).

#### Scenario: Links omit `/docs`

- **WHEN** a reader opens a current docs link such as `/support` or `/vite`
- **THEN** the page is served at that path without a `/docs` segment

### Requirement: Legacy `/sku/docs/` path redirects

The docs site MUST redirect legacy `/sku/docs` and `/sku/docs/…` paths to the equivalent `/sku/` and `/sku/…` links (preserving query and hash).

#### Scenario: Docs prefix redirect

- **WHEN** a reader opens `/sku/docs` or `/sku/docs/<path>`
- **THEN** they are redirected to `/sku/` or `/sku/<path>` respectively
- **AND** search and hash are preserved

### Requirement: Docsify hash route redirects

The docs site MUST redirect former docsify hash routes on `/sku` and `/sku/` (e.g. `#/./docs/vite?id=foo`) to the current links, stripping a leading `docs/` from the hash path when present and mapping `id=` query params to the fragment.

#### Scenario: Hash route redirect

- **WHEN** a reader opens `/sku` or `/sku/` with a docsify-style hash such as `#/./docs/vite?id=foo`
- **THEN** they are redirected to `/sku/vite#foo` (or the equivalent path without a leading `docs/`)
