---
'sku': patch
---

Introduce new dynamic route syntax

Dynamic routes should now be indicated by a `$` character rather than `:`. 

Usage of `:` for dynamic routes is now deprecated and will not work with the new `sku serve` command. However, `sku start` and `sku build` will continue to work.

**MIGRATION GUIDE**

Update your routes in `sku.config.js` to use the new `$` syntax.

```diff
{
- routes: ['/job/:id'],
+ routes: ['/job/$id'],
}
```

**Warning**: This will cause the affected routes to output a different folder structure. Make sure to update your web server route rules for the affected routes before releasing this change. 

Please reach out to #sku-support if you have any questions.