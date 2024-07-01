---
'sku': major
---

`sourceMapsProd` is now `true` by default

**BREAKING CHANGE**:

`sourceMapsProd` is now `true` by default. To enable the previous behaviour, set `sourceMapsProd: false` in your sku config:

```ts
// sku.config.ts
import type { SkuConfig } from 'sku';

export default {
  sourceMapsProd: false,
} satisfies SkuConfig;
```

**NOTE**: Production source maps can increase memory usage during builds to the point where the Node process exhausts its heap memory. If this occurs, you can increase the memory limit for the Node process by setting the `NODE_OPTIONS` environment variable to `--max-old-space-size=4096` (or a higher value) before running the build command.

For example:

```sh
NODE_OPTIONS=--max-old-space-size=4096 sku build
```
