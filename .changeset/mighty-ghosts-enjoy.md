---
'sku': minor
---

Start sku dev server middleware when running storybook

When running `sku storybook`, if you have configured `devServerMiddleware` in your sku config, that middleware will now be passed through to storybook and injected into its own middleware stack.
