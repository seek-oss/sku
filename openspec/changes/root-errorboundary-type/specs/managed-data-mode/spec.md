## MODIFIED Requirements

### Requirement: ErrorBoundary must not replace the html layout

An `ErrorBoundary` on the route that renders `<html>` replaces that layout on failure.
Apps MUST put `ErrorBoundary` on a descendant route so the document layout stays mounted.

`SkuRouteObject` MUST forbid `ErrorBoundary` on the top-level `routes` array.
A child of a `SkuRouteObject` MAY set `ErrorBoundary`.

#### Scenario: Child route ErrorBoundary keeps html

- **WHEN** the root layout renders `<html>`
- **AND** `ErrorBoundary` is on a child route
- **AND** that child fails
- **THEN** the response still includes the root layout’s `<html>`

#### Scenario: Top-level ErrorBoundary is a type error

- **WHEN** an app types `routes` as `SkuRouteObject[]`
- **AND** a top-level route sets `ErrorBoundary`
- **THEN** TypeScript reports a type error
- **AND** a child route may set `ErrorBoundary`

### Requirement: routesEntry exports routes

`routesEntry` MUST export named `routes` as `SkuRouteObject[]`.

`SkuRouteObject` MUST be a sku type helper `SkuRouteObject<Site extends string = string>` with `sites?: Site[]`, `ErrorBoundary` forbidden, and children that MAY set `ErrorBoundary` (not a wrapped React Router re-export).

Sku MUST NOT export a separate public type for nested routes.

#### Scenario: sites membership is typed from SiteOf

- **WHEN** `getSite` returns `'au' | 'nz'`
- **AND** the app types `routes` as `SkuRouteObject<SiteOf<typeof server>>[]`
- **THEN** `sites: ['au']` type-checks
- **AND** `sites: ['uk']` is a type error
