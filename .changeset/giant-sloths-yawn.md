---
'sku': minor
---

Add client side hot module reloading

Hot module reloading (HMR) is when your JS and CSS are updated without requiring a full page refresh. This change introduces two forms of HMR.

- React fast-refresh
- CSS (including CSS modules and treat files)

#### fast-refresh 

Fo fast-refresh to work there are a few gotchas to watch out. For components to succesfully hot reload, they must:

- Have a display name. Avoid using `export default` with anonymous functions.
- The file must only export React components (excluding types as they are not runtime exports)