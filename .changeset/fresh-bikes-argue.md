---
'sku': patch
---

Re-introduce lint rules requiring React import when using JSX

As sku v11 moved to the new [JSX transform](https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html), we removed all lint rules ensuring `React` was imported when using JSX. Unfortunately this change only works if all compile packages (e.g. braid-design-system) switch to sku v11 at the same time, which would also constitute a breaking change. To avoid a lot of package update churn, we are re-introducing the need for `React` imports when JSX is present.