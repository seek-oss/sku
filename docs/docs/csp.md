# Content Security Policy (CSP)

[CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) adds an extra layer of security to your app. For statically rendered apps, a `script-src` policy can be automatically generated for you. SSR apps have an extra step.

**This feature is not available to libraries**

## Setup

Set `cspEnabled: true` in your `sku.config.js`.

### Extra Hosts

If you need to allow scripts that are only known client side (e.g. scripts loaded by tag managers) you can add their URLs to the `cspExtraScriptSrcHosts` array in `sku.config.js`.

### Nonce Values

[Nonce] values can be used to permit inline scripts that are generated on client side.
Nonce values are created by calling `createUnsafeNonce` during render.

> The [Content Security Policy (CSP)] requires that scripts be declared ahead of time.
> For inline scripts this is typically done automatically by calculating a hash of their content when they are created during the initial render.
> This ensures only authorised scripts are run in client environments.
>
> When a script is created dynamically on the client it may not be possible to predict the required hash, in this case a nonce can be used.

**Warning:** Nonces are less safe than content hashes.
Please consider if other options are available and whether the risks are acceptable for your use-case.

`createUnsafeNonce`: Generates a random nonce value and returns it for use by the client. The nonce value is added to the generated [Content Security Policy (CSP)] Tags.

**Example: Using `createUnsafeNonce` to create a nonce value and use it client side**

```tsx
// render.tsx
export default {
  renderApp: ({ createUnsafeNonce }) => {
    const appHtml = renderToString(<App />);
    const dynamicScriptNonce = createUnsafeNonce();

    return { appHtml, dynamicScriptNonce };
  },
  provideClientContext: ({ environment, app }) => ({
    environment,
    dynamicScriptNonce: app.dynamicScriptNonce,
  }),

  renderDocument: ({ app, bodyTags, headTags }) => {
    // ..
  },
};
```

```tsx
// client.tsx
import App from './App';

export default ({ dynamicScriptNonce }) => {
  client.init({ nonce: dynamicScriptNonce });
  // ...
};
```

[nonce]: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/nonce
[Content Security Policy (CSP)]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy

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
