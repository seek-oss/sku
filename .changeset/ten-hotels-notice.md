---
'sku': major
---

Throw error when given unsupported arguments.
This is now the default behaviour of the updated commander.js version.

**BREAKING CHANGE**:

Excess command-arguments will now cause an error.
To fix this, remove any unsupported arguments provided to the command.

```bash
# Error
sku build extra-arg

> error: too many arguments for 'build'. Expected 0 arguments but got 1.

# Fix
sku build
```
