## MODIFIED Requirements

### Requirement: ErrorBoundary placement for the html route

An `ErrorBoundary` or `errorElement` on the route that renders `<html>` replaces that layout on failure.
Apps SHOULD put `ErrorBoundary` on a descendant route so page failures keep the document layout mounted.

Apps MAY set `ErrorBoundary` or `errorElement` on the html route.
That fallback MUST render a full `<html>` document.
It covers failures before sku pipes the document shell.

#### Scenario: Child route ErrorBoundary keeps html

- **WHEN** the root layout renders `<html>`
- **AND** `ErrorBoundary` is on a child route
- **AND** that child fails
- **THEN** the response still includes the root layout’s `<html>`

#### Scenario: Html-route ErrorBoundary may render a full document

- **WHEN** the root layout renders `<html>`
- **AND** `ErrorBoundary` is on that same route
- **AND** the fallback renders `<html>`, `<head>`, and `<body>`
- **THEN** a shell failure can render that fallback as the document
