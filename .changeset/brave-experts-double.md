---
'sku': major
---

Remove `sku chromatic` script

Due to changes in the way chromatic is setup, it now makes more sense for consumers to integrate with chromatic directly.

MIGRATION GUIDE

Follow the [chromatic install step](https://www.chromatic.com/docs/setup#install).

Once installed, you can setup CI as follows

```bash
yarn sku build-storybook
yarn chromatic --storybook-build-dir dist-storybook
```

Your `storybook-build-dir` is whatever you configured your `storybookTarget` as in `sku.config.js`. The default is `dist-storybook`.

BREAKING CHANGE

`sku chromatic` script is no longer available.