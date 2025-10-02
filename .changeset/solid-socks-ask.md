---
'@sku-lib/codemod': major
'@sku-lib/create': major
---

Throw error when given unsupported arguments.
This is now the default behaviour of the updated commander.js version.

**BREAKING CHANGE**:

Excess command-arguments will now cause an error.
To fix this, remove any unsupported arguments provided to the command.
