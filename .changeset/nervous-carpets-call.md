---
'sku': patch
---

Disable peer dependency validation for PNPM

The method we currently use to validate peer dependencies and warn users about duplicate package is not compatible with how PNPM organizes dependencies in `node_modules`. This feature has been disabled for PNPM repos until further notice.
