---
'sku': major
---

Support Storybook v7

sku now supports Storybook v7. Please read [the Storybook migration guide] for a high-level overview of what has changed. For a more detailed list of changes, take a look at [the full migration notes].
**NOTE**: Since sku installs and configures Storybook for you, a lot of the changes will not be relevant to users.

**BREAKING CHANGE**
As of Storybook v7, stories that use the `storiesOf` API will not work by default. The `storiesOf` API is deprecated and will be removed in Storybook v8, so it is highly encouraged to migrate your stories to the [Component Story Format (CSF)][csf].

Migration can be done automatically via the migration tools provided by Storybook:

```sh
npx storybook@latest migrate storiesof-to-csf --glob="src/**/*.stories.tsx"
```

After doing this migration, your stories may need some manual cleanup to function correctly, such as adding [a default metadata export][meta].

When your stories are working, you can also optionally migrate to the newer [CSF 3]:

```sh
npx storybook@latest migrate csf-2-to-3 --glob="src/**/*.stories.tsx"
```

If you cannot migrate your stories to CSF, or you need to dynamically generate stories with `storiesOf` (see [this issue][storiesof issue] for more info on the future of the `storiesOf` API), you can set the `storybookStoryStore` flag to `false` in your sku config:

```ts
import { type SkuConfig } from 'sku';

export default {
  storybookStoryStore: false,
} satisfies SkuConfig;
```

[the storybook migration guide]: https://storybook.js.org/docs/react/migration-guide#page-top
[the full migration notes]: https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#from-version-65x-to-700
[csf]: https://storybook.js.org/docs/react/api/csf
[meta]: https://storybook.js.org/docs/react/api/csf#default-export
[csf 3]: https://storybook.js.org/blog/storybook-csf3-is-here/
[storiesof issue]: https://github.com/storybookjs/storybook/issues/9828#issuecomment-1370291568
