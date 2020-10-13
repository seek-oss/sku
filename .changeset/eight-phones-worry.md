---
'sku': minor
---

**Playroom:** Update to v0.22.0, add `playroomScope` option

You can now use Playroom's new custom scope feature by providing a `playroomScope` file.

**EXAMPLE USAGE**

sku.config.js:

```js
module.exports = {
  playroomScope: './playroom/useScope.ts',
}
```

useScope.ts:

```js
import { useToast } from 'braid-design-system';

export default function useScope() {
  return {
    showToast: useToast()
  }
}
```
