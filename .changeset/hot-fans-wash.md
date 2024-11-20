---
'sku': patch
---

`sku translations`: Throw an error when `languages` has not been configured

Previously, if `languages` was not configured, the `sku translations` command would log a message and continue to run the command, which would eventually error due to the lack of a vocab config (generated from the `languages` config).
We now throw an error sooner to make it clear that the `languages` configuration is required to run any `sku translations` commands.
