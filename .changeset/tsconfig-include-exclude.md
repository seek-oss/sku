---
'sku': minor
---

Add new sku config options: [`tsconfigInclude`][tsconfiginclude] and [`tsconfigExclude`][tsconfigexclude], to control which files are included in the TypeScript compilation process. This is useful for excluding files that are not part of the TypeScript project, such as `node_modules` or `dist` folders.

Previously, sku managed the `include` field in `tsconfig.json`, but this was problematic for projects that wanted more fine grained control over what is included and/or excluded from compilation. This became even more of a problem when tools like typescript-eslint would complain about some code not being included in the TypeScript project.

> **Note**: If you were previously using [`srcPaths`][srcpaths] for this purpose, you should now use `tsconfigInclude` instead.

[tsconfiginclude]: https://seek-oss.github.io/sku/#/./docs/configuration?id=tsconfiginclude
[tsconfigexclude]: https://seek-oss.github.io/sku/#/./docs/configuration?id=tsconfigexclude
[srcpaths]: https://seek-oss.github.io/sku/#/./docs/configuration?id=srcpaths

**EXAMPLE USAGE**:

```js
const config = {
  tsconfigInclude: ['packages', 'site'],
  tsconfigExclude: ['**/scripts'],
};
```
