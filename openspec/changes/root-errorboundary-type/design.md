## Context

The root layout renders `<html>`. React Router replaces that route’s `Component` when `ErrorBoundary` or `errorElement` is on the same route.
The create template already nests the boundary on a child.

## Decisions

`SkuRouteObject` (the `routes` array) sets `ErrorBoundary?: never` and `errorElement?: never`.
`errorElement` is React Router’s element form of the same replacement.
Root `lazy` is derived from `RouteObject['lazy']` with those keys forbidden, so `lazy: () => ({ errorElement })` cannot replace `<html>`.
Children are `SkuChildRouteObject`, which still allows both, including via `lazy`.
`SkuChildRouteObject` is a sku-internal type. It is not exported from `sku/runtime`.

`never` rejects assignment from a variable, not only a fresh object literal.

## Risks / Trade-offs

- [Extracted child typed as `SkuRouteObject`] → Type error if it sets `ErrorBoundary` or `errorElement`. Leave it unannotated, or type it as `NonNullable<SkuRouteObject['children']>[number]`.
- [Casts] → Types cannot see it. Runtime is unchanged.
