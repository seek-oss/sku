---
'sku': minor
---

storybook: Add `viteFinal` API to the `sku/config/storybook` entrypoint

This API is the Vite equivalent to the existing webpack-specific APIs already available via the `sku/config/storybook` entrypoint.
It injects sku-specific configuration into Storybook's Vite config, helping to ensure your Storybook works correctly with Braid and Vanilla Extract.
Please read the [sku Storybook docs] for more information.

[sku Storybook docs]: https://seek-oss.github.io/sku/docs/storybook
