# Content Security Policy (CSP)

[CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) adds an extra layer of security to your app. For statically rendered apps, a `script-src` policy can be automatically generated for you. SSR apps have an extra step.

**This feature is not available to libraries**

## Setup

Set `cspEnabled: true` in your `sku.config.js`.

If you need to allow scripts that are only known client side (e.g. scripts loaded by tag managers) you can add their URLs to the `cspExtraScriptSrcHosts` array in `sku.config.js`.

### Extra SSR Setup

As sku doesn't handle the returned HTML in SSR apps, any extra scripts (scripts not created by sku) must be registered.

In the `renderCallback` function, register all extra script tags (inline and external) via the `registerScript` function.

> If you are using multi-part responses via the `flushHeadTags` API, all scripts must be registered before sending the the initial response.

```tsx
import type { Server } from 'sku';

const renderCallback: Server['renderCallback'] = (
  { SkuProvider, getHeadTags, getBodyTags, registerScript },
  req,
  res,
) => {
  const someExternalScript = `<script src="https://code.jquery.com/jquery-3.5.0.slim.min.js"></script>`;
  const someInlineScript = `<script>console.log('Hi');</script>`;

  registerScript(someExternalScript);
  registerScript(someInlineScript);

  const app = renderToString(
    <SkuProvider>
      <App />
    </SkuProvider>,
  );

  res.send(`
   <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>My Awesome Project</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        ${getHeadTags()}
      </head>
      <body>
        <div id="app">${app}</div>
        ${someInlineScript}
        ${getBodyTags()}
        ${someExternalScript}
      </body>
    </html>`);
};
```
