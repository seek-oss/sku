---
'sku': patch
---

Replace \$language in route when using dev server

When implementing `renderApp` for statically rendered applications previously `route` could contain `$language` inside the URL.

Now `route` will have any `$language` value replaced with the current language being rendered.

```ts
const skuRender: Render<RenderContext> = {
  renderApp: ({ SkuProvider, route, language }) => {
    // e.g. language === "en"

    // previous behaviour
    // route === "/$language/home"

    // new behaviour
    // route === "/en/home"
  },
  ...
}
```