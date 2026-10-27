## Why

An `ErrorBoundary` on the html route replaces that route’s `Component`, including `<html>`.
A document-shaped html-route fallback is valid for shell failure.
A child-route boundary keeps the flushed shell for later failures.

## What Changes

- Docs describe two placements: child for page failures, optional full-document html-route for shell failure.
- Sku patch changeset.

## Non-goals

- Runtime warnings or production throws.
- Changing who renders `<html>` / `<head>` / `<body>`.
- Changing the template `ErrorBoundary` nest.
- An ESLint rule.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `managed-data-mode`: Docs describe child vs html-route `ErrorBoundary` placement.
- `ssr`: Docs no longer say `ErrorBoundary` MUST NOT sit on the html route.

## Impact

- Docs and a sku patch changeset.
