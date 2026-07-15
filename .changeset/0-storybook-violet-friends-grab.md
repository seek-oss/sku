---
'sku': major
---

`storybook`: Drop support for Storybook v7, v8 and v9

**BREAKING CHANGE**

`sku`'s `@storybook/react-webpack5` peer dependency range no longer includes `^7.0.0 || ^8.0.0 || ^9.0.0`. `^10.0.0` is now the only supported version range. Consumers must upgrade `@storybook/react-wepback5` and any other Storybook-related dependencies to at least v10.

Please refer to the [Storybook v10 migration guide] for breaking changes as well as guidance on automatically upgrading your Storybook to v10.

[Storybook v10 migration guide]: https://storybook.js.org/docs/10/releases/migration-guide

