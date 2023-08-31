---
'sku': minor
---

Drop support for running `devServerMiddleware` alongside `sku storybook`

Now that sku supports Storybook configuration via the `.storybook` directory, this feature is unnecessary.
Storybook middleware can be configured by creating a `middleware.js` file in the `.storybook` directory.
See [the sku docs][sku storybook middleware] for more info.

**NOTE**: While this is technically a breaking change, it does not affect app builds, therefore it has been downgraded to a `minor` release.

[sku storybook middleware]: https://seek-oss.github.io/sku/#/./docs/storybook?id=devserver-middleware
