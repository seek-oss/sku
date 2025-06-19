---
'sku': minor
---

- Change `__unsafeDangerouslySetViteConfig` to `__UNSAFE_EXPERIMENTAL__dangerouslySetViteConfig` to align with the existing naming convention.
- Add `__UNSAFE_EXPERIMENTAL__cjsInteropDependencies` to the `SkuConfig` type. This is an array of cjs import paths that have both a default and named exports. This is used to enable CommonJS interop for these dependencies when using the `vite` bundler.
