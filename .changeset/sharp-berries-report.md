---
'sku': minor
---

Add Experimental `render` parameter in `renderApp`

The new `render` method can be called instead of React DOM's `renderToString`. It is an asynchronous function, but once awaited should return the same result.

This new function won't error when hitting suspending during a static render, instead it'll wait for all suspended boundaries to resolve.

```diff
-import { renderToString } from 'react-dom/server';

const skuRender: Render<RenderContext> = {
  -renderApp: ({ SkuProvider, environment }) => {
  +renderApp: ({ SkuProvider, environment, render }) => {
    -const appHtml = renderToString(
    +const appHtml = render(
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