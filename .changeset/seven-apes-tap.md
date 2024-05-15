---
'sku': minor
---

Add support for [removing assertion functions][assertion removal docs] named `invariant` and assertions from the `tiny-invariant` library, a lightweight alternative to `assert`

**EXAMPLE USAGE**:

```tsx
import React from 'react';
import invariant from 'tiny-invariant';

export const Rating = ({ rating }: { rating: number }) => {
  invariant(rating >= 0 && rating <= 5, 'Rating must be between 0 and 5');

  return <div>...</div>;
};
```

[assertion removal docs]: https://seek-oss.github.io/sku/#/./docs/extra-features?id=assertion-removal
