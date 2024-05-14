---
'sku': minor
---

Add support for removing assertion functions named `invariant` and assertions from the `tiny-invariant` library

**EXAMPLE USAGE**:

```tsx
import React from 'react';
import invariant from 'tiny-invariant';

export const Rating = ({ rating }: { rating: number }) => {
  invariant(rating >= 0 && rating <= 5, 'Rating must be between 0 and 5');

  return <div>...</div>;
};
```
