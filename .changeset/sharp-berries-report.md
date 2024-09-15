---
'sku': minor
---

Add experimental `renderToString` parameter in `renderApp`

The new `renderToString` method can be called instead of React DOM's `renderToString`. It is an asynchronous function, but once awaited should return the same result.

This new function won't error when hitting suspended components during a static render, instead it'll wait for all suspended boundaries to resolve.

**Note:** `react-dom` is now an optional peer dependency for use in this function. All known uses of static rendering use `react-dom` and shouldn't need to make a change.

The function is being provided to enable teams to trial the behaviour, but is not encouraged for production use.

```diff
-import { renderToString } from 'react-dom/server';

const skuRender: Render<RenderContext> = {
-  renderApp: ({ SkuProvider, environment }) => {
+  renderApp: ({ SkuProvider, environment, renderToString }) => {
-    const appHtml = renderToString(
+    const appHtml = await renderToString(
      <SkuProvider>
        <App environment={environment as ClientContext['environment']} />
      </SkuProvider>,
    );

    return {
      appHtml,
    };
  },
  // ...
};
```

This new feature is experimental, and is likely to change in implementation or may be removed completely.

