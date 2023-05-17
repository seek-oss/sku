---
'sku': minor
---

Add support for Storybook's `preview.js` file and re-export the `DecoratorFn` type from `@storybook/react`

sku now supports global customization of story rendering via a `.storybook/preview.(js|ts|tsx)` file.

**EXAMPLE USAGE:**

```tsx
import 'braid-design-system/reset';
import apac from 'braid-design-system/themes/apac';
import { BraidProvider } from 'braid-design-system';

import React from 'react';
import type { DecoratorFn } from 'sku/@storybook/react';

// This will wrap every story in a BraidProvider
export const decorators: DecoratorFn = [
  (Story) => (
    <BraidProvider theme={apac}>
      <Story />
    </BraidProvider>
  ),
];
```

See [the Storybook docs][storybook preview.js] for more info.

[storybook preview.js]: https://storybook.js.org/docs/react/configure/overview#configure-story-rendering
