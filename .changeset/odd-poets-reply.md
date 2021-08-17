---
'sku': major
---

Upgrade to Jest 27

Jest 27 introduces a bunch of new default settings, primarily switching the default test environment from `jsdom` to `node`. However, sku will remain using `jsdom` by default as we feel it makes more sense as a default for UI development. You can read through the [Jest 27 release post](https://jestjs.io/blog/2021/05/25/jest-27) to see the other breaking changes that have occured.