---
'sku': minor
---

- Change `__unsafeDangerouslySetViteConfig` to `__UNSAFE_EXPERIMENTAL__dangerouslySetViteConfig` to align with the existing naming convention.
- Add `__UNSAFE_EXPERIMENTAL__cjsInteropDependencies` to the `SkuConfig` type. This experimental feature allows users to specify CJS dependencies that should be treated as ESM by `vite`.
