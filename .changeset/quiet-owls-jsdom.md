---
'sku': major
---

Upgrade `jsdom` to v31 for Vitest's `jsdom` test environment.

**BREAKING CHANGE**

sku now depends on `jsdom` v31 directly. Previously, apps got `jsdom` v26 through `jest-environment-jsdom`.
Tests that relied on `jsdom` v26 behavior may need updating.
