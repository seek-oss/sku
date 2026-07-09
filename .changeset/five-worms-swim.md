---
'sku': major
---

`configure`: Remove automatic `.eslintignore` migration

**BREAKING CHANGE**:

Automatic `.eslintignore` migration was added in sku v14 as part of the migration to ESLint v9's flat config format. This automatic migration logic no longer serves a purpose for most sku consumers, so it has been removed. Consumers upgrading from sku v13 or older should first migrate to v14 or v15 before attempting to migrate to v16.
