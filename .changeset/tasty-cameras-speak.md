---
'sku': major
---

Drop support for [`seek-style-guide`]

BREAKING CHANGE

`seek-style-guide` is no longer support by sku. Flow support was already removed from sku in [v11], so
any `seek-style-guide` components that use flow currently don't work with sku. However, there were remnants
of `seek-style-guide` still present in sku's codebase. Specifically, import optimization and
component mocking. These features have now been removed. Please migrate to [`braid-design-system`].

[`seek-style-guide`]: https://github.com/seek-oss/seek-style-guide
[v11]: https://github.com/seek-oss/sku/releases/tag/v11.0.0
[`braid-design-system`]: https://seek-oss.github.io/braid-design-system/
