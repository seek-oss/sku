---
'sku': major
---

`sourceMapsProd` is now `true` by default

To enable the previous behaviour, set `sourceMapsProd: false` in your sku config:

```ts
// sku.config.ts
import type { SkuConfig } from 'sku';

export default {
  sourceMapsProd: false,
} satisfies SkuConfig;
```
