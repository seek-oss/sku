---
'sku': major
---

Remove LESS style support

**BREAKING CHANGE**:

[LESS] style support has been removed.

**MIGRATION GUIDE**:

Please migrate all styles defined in `.less` files to [Vanilla Extract] styles. `*.less.d.ts` files are no longer git-ignored and should be deleted. Reach out in [`#sku-support`] if you need help with this migration.

[Vanilla Extract]: https://seek-oss.github.io/sku/#/./docs/styling?id=vanilla-extract
[LESS]: http://lesscss.org/
[`#sku-support`]: https://seek.enterprise.slack.com/archives/CDL5VP5NU
