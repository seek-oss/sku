---
'sku': patch
---

Propagate `--config` argument to Storybook process

Fixes a bug where `sku storybook` and `sku build-storybook` would not honour a custom sku config specified via the `--config` flag
