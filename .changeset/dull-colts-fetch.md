---
'sku': major
---

Remove Storybook dependencies and `@storybook/react` entrypoint

**BREAKING CHANGE**

Sku no longer installs Storybook dependencies. Additionally, it no longer provides the `sku/@storybook/react` entrypoint. If you are using Storybook, you will need to install Storybook dependencies yourself. See [`sku`'s Storybook documentation][storybook docs] for more information.

**MIGRATION GUIDE**:

```sh
pnpm install -D @storybook/react
```

```diff
// MyComponent.stories.tsx

-import type { Meta } from 'sku/@storybook/react';
+import type { Meta } from '@storybook/react';
```

[storybook docs]: https://seek-oss.github.io/sku/#/./docs/storybook
