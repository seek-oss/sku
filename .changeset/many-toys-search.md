---
'sku': minor
---

Add `libraryFile` configuration option

This option allows the file name of the library to be specified in the sku
configuration. If this option is not specified then the `libraryName` option
will be used for this purpose instead (note that this is the previously
existing behaviour).

**EXAMPLE USAGE**:

```typescript
// sku.config.ts
import type { SkuConfig } from 'sku';

const skuConfig: SkuConfig = {
  libraryEntry: 'src/library.js',
  renderEntry: 'src/render.js',
  libraryName: 'MyAwesomeLibrary',
  libraryFile: 'my-awesome-library',
};

export default skuConfig;
```
