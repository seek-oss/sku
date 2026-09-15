## Context

The root layout renders `<html>`. React Router replaces that route’s `Component` when `ErrorBoundary` is on the same route.
The create template already nests the boundary on a child.

## Decisions

`SkuRouteObject` (the `routes` array) sets `ErrorBoundary?: never`.
Children are `SkuChildRouteObject`, which still allows `ErrorBoundary`.
`SkuChildRouteObject` is a sku-internal type. It is not exported from `sku/runtime`.

`never` rejects assignment from a variable, not only a fresh object literal.

## Risks / Trade-offs

- [Extracted child typed as `SkuRouteObject`] → Type error if it sets `ErrorBoundary`. Leave it unannotated, or type it as `NonNullable<SkuRouteObject['children']>[number]`.
- [Casts / `lazy()` root] → Types cannot see it. Runtime is unchanged.
