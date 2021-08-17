---
'sku': patch
---

Re-introduce lint rules requiring React import when using JSX

As Sku 11 moved to the new [JSX transform](https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html) we removed all lint rules ensuring `React` was imported when using JSX. While it is still safe to remove the React imports in isolated projects, compile packages (eg. braid-design-system) will have to introduce a breaking change to remove them. To avoid a lot of package update churn we are re-introducing the need for `React` imports when JSX is present.