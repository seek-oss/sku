---
'sku': minor
---

Upgrade `eslint` to `^8.56.0` and `eslint-config-seek` to `^13.0.0`

Due to changes in `eslint-config-seek@13.x`, consumers may see new linting errors or warnings. Some of these may be auto-fixable via `sku format`, but others may require manual intervention. Please see [the `eslint-config-seek` changelog][changelog] for more information.

[changelog]: https://github.com/seek-oss/eslint-config-seek/blob/master/CHANGELOG.md