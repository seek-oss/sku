---
'sku': minor
---

Allow importing external CSS from `node_modules`.

CSS from third-party dependencies can be loaded using a side-effect import, e.g.

```tsx
import { SomeComponent } from "some-package";

import "some-package/dist/styles.css";

export const MyComponent = () => {
  return <SomeComponent>{/* ... */}</SomeComponent>;
};
```
