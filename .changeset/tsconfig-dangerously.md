---
'sku': minor
---

`srcPaths` no longer affects `tsconfig.json#include`. Instead, you can use [`dangerouslySetTSConfig`][dangerous] option to have more control over which files are included in the TypeScript compilation process.

Previously, sku managed the `include` field in `tsconfig.json`, but this was problematic for projects that wanted more fine grained control over what is included and/or excluded from compilation.

> **Note**: If you were previously using [`srcPaths`][srcpaths] for this purpose, you should remove the paths which are not source files.

[dangerous]: https://seek-oss.github.io/sku/#/./docs/configuration?id=dangerouslysettsconfig
[srcpaths]: https://seek-oss.github.io/sku/#/./docs/configuration?id=srcpaths
