---
'sku': major
---

Remove automatic configuration of Storybook

**BREAKING CHANGE**

Sku no longer configures your `.storybook/main.ts` file for you. If you are using Storybook, you will need to configure it yourself. See the [Storybook docs] for more information.

**MIGRATION GUIDE**:

Minimal Storybook configuration:

```ts
// .storybook/main.ts
import { babel, webpackFinal } from 'sku/config/storybook';
import type { StorybookConfig } from '@storybook/react-webpack5';

export default {
  stories: ['../src/**/*.stories.tsx'],
  framework: '@storybook/react-webpack5',
  core: {
    builder: {
      name: '@storybook/builder-webpack5',
      options: {
        fsCache: true, // For faster startup times after the first `storybook dev`
      },
    },
  },
  babel,
  webpackFinal,
} satisfies StorybookConfig;
```

[storybook docs]: https://seek-oss.github.io/sku/#/./docs/storybook
