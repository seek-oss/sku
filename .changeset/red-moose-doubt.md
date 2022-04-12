---
'sku': patch
---

test: Run Jest using the CI flag when in CI environment

Tests run in CI should fail if a new snapshot is written, this was not the case and needed to be opted into manually by passing the `--ci` [flag to Jest](https://jestjs.io/docs/cli#--ci).
