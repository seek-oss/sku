## Why

An `ErrorBoundary` or `errorElement` on the html/root route replaces `<html>` on failure.
Apps already type `routes` as `SkuRouteObject[]`, but that type accepts the mistake.

## What Changes

- `SkuRouteObject` forbids `ErrorBoundary` and `errorElement` on the top-level `routes` array, including via `lazy`.
- Children of `SkuRouteObject` still allow both (no extra public type).
- Docs state the type error and point at the child-route pattern.
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

- `managed-data-mode`: `SkuRouteObject` rejects a top-level `ErrorBoundary` or `errorElement`, including via `lazy`.

## Impact

- Public `sku/runtime` type `SkuRouteObject` (no new export).
- Type-only break for apps that put `ErrorBoundary` or `errorElement` on a `SkuRouteObject` literal or its `lazy` result.
- Docs and a sku patch changeset.
