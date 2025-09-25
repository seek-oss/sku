---
'@sku-lib/codemod': major
'@sku-lib/create': major
'sku': major
---

Updating commander.js to the latest version.

#### Breaking Change

Excess command-arguments will now cause an error.

To fix this, remove any unsupported arguments provided to the command.

```bash
# Error
sku build extra-arg

> error: too many arguments for 'build'. Expected 0 arguments but got 1.

# Fix
sku build
```
