---
'sku': minor
---

Re-export `Meta` and `StoryObj` types from `@storybook/react`

The `Meta` and `StoryObj` types are now re-exported under `sku/@storybook/react`.

These types are useful for typing [CSF 3 stories] which are the new recommended way of writing stories.

**EXAMPLE USAGE**:

```ts
import type { Meta } from 'sku/@storybook/react';

import { MyComponent } from './MyComponent';

const meta: Meta<typeof MyComponent> = {
  title: 'Path/To/MyComponent',
  component: MyComponent,
};
export default meta;

type Story = StoryObj<typeof MyComponent>;

export const Basic: Story = {};

export const WithProp: Story = {
  render: () => <MyComponent prop="value" />,
};
```

[CSF 3 stories]: https://storybook.js.org/docs/react/api/csf
