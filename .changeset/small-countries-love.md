---
'sku': major
---

Remove support for `.css.js` files

**BREAKING CHANGE**

`.css.js` ([css-in-js-loader](https://github.com/naistran/css-in-js-loader)) files are no longer supported.

**MIGRATION GUIDE**

Any existing `.css.js` files will need to be removed. Ideally, replace these styles with Braid components. If that's not possible you can re-create the styles using [css-modules](https://seek-oss.github.io/sku/#/./docs/styling?id=locally-scoped-css) or [treat files](https://seek-oss.github.io/sku/#/./docs/styling?id=treat).

**Note**: It is our understanding that there is very limited use of this feature. If you have many `.css.js` files in your project please contact #sku-support for help.