---
'sku': minor
---

Add client side hot module reloading

Hot module reloading (HMR) is updating JS and CSS assets without requiring a full page refresh. This allows you to retain app state between code changes. This change introduces hot reloading to React components, treat files and CSS modules.

**React fast-refresh**

For fast-refresh to work there are a few gotchas to watch out. For components to succesfully hot reload, they must:

- Have a display name. Avoid using `export default` with anonymous functions.
- The file must only export React components (excluding types as they are not runtime exports)

We're considering adding lint rules for these scenarios in future. 

**NOTE:** React >16.9 is required for fast-refresh to work

In some cases a change cannot be hot reloaded, in these situations sku should fallback to performing a full page refresh. You should **never** need to manually refresh your browser.

If your app is not hot reloading when you would expect it to or you are being forced to manually refresh the page, please contact #sku-support.

You can disable HMR by setting `SKU_HOT=false`.

