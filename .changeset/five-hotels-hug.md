---
'sku': minor
---

Add import order linting

You can now optionally enable linting of import order by adding `orderImports: true` to your sku config. This rule supports auto-fix.

**WARNING**

Changing import order can affect the behaviour of your application. After enabling `orderImports`, please ensure your app still works and looks as expected.

Also, any existing comments (e.g. `@ts-ignore`) above imports will **not** be moved as part of the autofix. If your app has a lot of `@ts-ignore` comments then please be very wary when applying this rule.


