---
'sku': major
---

`storybook`: Publish Storybook config as ESM-only

**BREAKING CHANGE**:

The Storybook config available via the `sku/config/storybook` entrypoint is now published as ESM-only and requires a version of Storybook that supports ESM config. This change is coupled with dropping support for older Storybook versions, so a compatible (ESM-supporting) version is guaranteed as part of the required Storybook upgrade.
