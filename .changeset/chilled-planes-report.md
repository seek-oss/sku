---
'sku': minor
---

Re-export the `DecoratorFn` type from `@storybook/react`

**EXAMPLE USAGE**:

```tsx
// preview.tsx
import React from 'react';

import type { DecoratorFn } from 'sku/@storybook/react';

export const decorators: DecoratorFn[] = [
  (Story) => (
    <div>
      <Story />
    </div>
  ),
];
```
