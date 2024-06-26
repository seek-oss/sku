---
'sku': patch
---

Minify build output with [SWC]

Minification of production build output is now performed by [SWC]. Previously this was performed by [Terser]. This should result in a noticeable reduction in build times for larger projects, as well as a slight decrease in bundle size.

[swc]: https://swc.rs/docs/configuration/minification
[terser]: https://terser.org/
