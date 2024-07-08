---
'sku': major
---

Update default supported browsers

`sku` applications and libraries now default to supporting more recent browser versions:

| Browser          | Oldest supported version |
| ---------------- | ------------------------ |
| Chrome           | 84                       |
| Edge             | 84                       |
| Safari           | 14.1                     |
| Firefox          | 63                       |
| Samsung Internet | 14.0                     |

**BREAKING CHANGE**:

Production builds will now contain code that may not be compatible with older browser versions. If your application still needs to support older browsers, you can configure a custom [browserslist] query via the [`supportedBrowsers`] configuration option in your sku config.

[browserslist]: https://browsersl.ist/
[`supportedBrowser`]: https://seek-oss.github.io/sku/#/./docs/configuration?id=supportedbrowsers
