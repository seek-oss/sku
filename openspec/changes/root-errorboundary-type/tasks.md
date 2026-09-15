## 1. Types

- [x] 1.1 `SkuRouteObject` forbids `ErrorBoundary` and `errorElement`, including via `lazy`
- [x] 1.2 Children of `SkuRouteObject` still allow `ErrorBoundary` and `errorElement` (type not exported)
- [x] 1.3 Runtime route trees accept the wider child route shape

## 2. Tests and release

- [x] 2.1 Cover top-level type error and child `ErrorBoundary` / `errorElement` (JSX and `lazy`)
- [x] 2.2 Docs
- [x] 2.3 Sku patch changeset
