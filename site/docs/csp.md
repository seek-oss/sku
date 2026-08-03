# Content Security Policy (CSP)

[CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) adds an extra layer of security to your app.
For statically rendered apps, a `script-src` policy can be automatically generated for you. SSR apps have an extra step.

Badges mark solution-specific behaviour: <Badge type="tip" text="Static" />, <Badge type="tip" text="SSR" />, <Badge type="info" text="Webpack SSR" />. See [Server rendering](./ssr/).

- **SSR** <Badge type="tip" text="SSR" />: CSP is delivered as **HTTP headers** (`Content-Security-Policy` and optional `Content-Security-Policy-Report-Only`), derived from the document shell plus nonces and hashes of bootstrap scripts. Meta `http-equiv` CSP is not used on the SSR path. See [Server rendering → CSP](./ssr/csp.md).

> [!NOTE]
> This feature is not available to libraries

## Setup

Set `cspEnabled: true` in your `sku.config.js`.

### Delivery

For **static apps**, the `cspDelivery` option controls how the enforcing CSP is delivered and can be set to one of two values:

- `tag`: The CSP will be embedded directly in the rendered HTML content via a `<meta http-equiv="Content-Security-Policy" …>` tag.
  No further action will be required to enable the CSP.
  This is the default behaviour if no `cspDelivery` option is specified.
- `header`: The CSP will be written to a JSON file alongside the rendered HTML content (e.g. `index.html.json`) in the `metadata.csp` property, and no `<meta http-equiv="Content-Security-Policy" …>` tag will be generated.
  Extra steps will be required at deployment and/or request time to ensure the value of this property is returned as a `Content-Security-Policy` header in the response for the rendered HTML content.

`cspDelivery` applies to **Static** only (`buildType` unset / `'static'`). SSR always emits real HTTP CSP headers and ignores `cspDelivery`.

### Extra Hosts

If you need to allow scripts that are only known client side (e.g. scripts loaded by tag managers) you can add their URLs to the `cspExtraScriptSrcHosts` array in your `sku.config.js`.

SSR assumes a relative `publicPath` (e.g. `/` or `/static/`), so sku-owned Document assets are covered by `'self'`. Absolute `http(s)` / CDN `publicPath` is not supported for SSR — use `cspExtraScriptSrcHosts` for third-party scripts only.

### Report To

The `cspReportTo` option allows reports of CSP violations to be captured via the browser [Reporting API].
This option can be configured either as an _endpoint name_, a _URL_, or as a tuple of both, with the following outcome:

- If only an _endpoint name_ is specified, then this value will be included in the CSP as the value of the [`report-to`] directive, and no [`Reporting-Endpoints`] header will be emitted.
- If only a _URL_ is specified, then an endpoint name will be generated automatically and included in the CSP as the value of the [`report-to`] directive, and a [`Reporting-Endpoints`] header will be emitted containing the generated endpoint name and the provided URL.
- If both an _endpoint name_ and a _URL_ is specified, then the provided endpoint name will be included in the CSP as the value of the [`report-to`] directive, and a [`Reporting-Endpoints`] header will be emitted containing both the provided endpoint name and URL.

For **static apps**, the `cspReportTo` option is only effective when using the `header` [delivery option](#delivery), and an emitted [`Reporting-Endpoints`] header is written to the same JSON file in the `metadata.reportingEndpoints` property.

SSR ignores the delivery option, so `cspReportTo` applies whenever `cspEnabled` is `true`, and an emitted [`Reporting-Endpoints`] header is sent as a real response header.

[Reporting API]: https://developer.mozilla.org/en-US/docs/Web/API/Reporting_API
[`report-to`]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/report-to
[`Reporting-Endpoints`]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Reporting-Endpoints

### Nonce Values

[Nonce] values can be used to permit inline scripts that are generated client side.

> [!NOTE]
> The [Content Security Policy (CSP)] requires that scripts be declared ahead of time.
> For inline scripts this is typically done automatically by calculating a hash of their content when they are created during the initial render.
> This ensures only authorised scripts are run in client environments.
>
> When a script is created dynamically on the client it may not be possible to predict the required hash, in this case a nonce can be used.

> [!WARNING]
> Nonces are less safe than content hashes.
> Please consider if other options are available and whether the risks are acceptable for your use-case.

#### SSR <Badge type="tip" text="SSR" /> <Badge type="warning" text="experimental" />

SSR uses **at most one** CSP nonce per HTML response, minted **only when explicitly requested**, and included in the CSP header **only if requested**.

A nonce is requested by:

- sku itself, when attaching a `nonce` to React stream scripts (post-shell inline scripts that cannot be pre-hashed)
- Express middleware: `req.getCspNonce()` (mint-on-read; later calls return the same value)
- React Router loaders/actions: `getCspNonce()` from `sku` (same store while sku is rendering)

All of those share one value for the response. Known bootstrap script bodies are still allowed via sha256 hashes. If nothing requests a nonce (for example a response that never runs the HTML stream renderer), CSP is still emitted (hashes, `'self'`, configured hosts) **without** a `'nonce-…'` source.

A `nonce` is not available in client code. The result of `getCspNonce` will be an empty string if called from the browser. This allows it to be safely used isomorphic rendering.

Do not use webpack’s `createUnsafeNonce` for SSR — that API can create multiple distinct nonces per render. SSR intentionally does not offer a multi-nonce factory.

```tsx
import { getCspNonce } from 'sku';
import { defineServerEntry } from 'sku/ssr';
import type { RouteObject } from 'react-router';

// Inside routesEntry `routes`
const homeRoute = {
  path: '/',
  loader: () => ({ nonce: getCspNonce() }),
  // ...
} satisfies RouteObject;

// src/server.tsx
const server = defineServerEntry({
  middleware: [
    (req, res, next) => {
      // Same nonce value as getCspNonce() / the CSP header for this request
      res.locals.cspNonce = req.getCspNonce?.();
      next();
    },
  ],
});
export default server;
```

#### Webpack SSR / static apps <Badge type="info" text="Webpack SSR" />

`createUnsafeNonce`: Generates a random nonce value and returns it for use by the client. The nonce value is added to the generated [Content Security Policy (CSP)] Tags.

**Example: Using `createUnsafeNonce` to create a nonce value and use it client side**

::: code-group

```tsx [render.tsx]
export default {
  renderApp: ({ createUnsafeNonce }) => {
    const appHtml = renderToString(<App />);
    const dynamicScriptNonce = createUnsafeNonce(); // [!code highlight]

    return { appHtml, dynamicScriptNonce };
  },
  provideClientContext: ({ environment, app }) => ({
    environment,
    dynamicScriptNonce: app.dynamicScriptNonce,
  }),

  renderDocument: ({ app, bodyTags, headTags }) => {
    // ...
  },
};
```

```tsx [client.tsx]
import App from './App';

export default ({ dynamicScriptNonce }) => {
  client.init({ nonce: dynamicScriptNonce }); // [!code highlight]
  // ...
};
```

:::

[nonce]: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/nonce
[Content Security Policy (CSP)]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy

### Extra SSR Setup (Webpack)

As sku doesn't handle the returned HTML in Webpack SSR apps, any extra scripts (scripts not created by sku) must be registered.

In the `renderCallback` function, register all extra script tags (inline and external) via the `registerScript` function.

> [!IMPORTANT]
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

  registerScript(someExternalScript); // [!code highlight]
  registerScript(someInlineScript); // [!code highlight]

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

### Report-only Content Security Policy

A "report-only" Content Security Policy can be enabled by setting `cspReportOnlyEnabled: true` in your `sku.config.js`.
This will cause a [`Content-Security-Policy-Report-Only`] header to be generated.

By default the report-only CSP will have the same content as the standard CSP, including the same [extra hosts](#extra-hosts).
This can be changed by setting the `cspReportOnlyExtraScriptSrcHosts` array in `sku.config.js` to contain the script URLs for the report-only CSP.
Similarly, the report-only CSP will share the same [reporting](#report-to) configuration as the standard CSP, and this also can be changed by setting the `cspReportOnlyReportTo` option.

Unlike the standard CSP, a report-only CSP can only be delivered via an HTTP header and not via a `<meta http-equiv>` tag.
As such there is no explicit [delivery option](#delivery) for a report-only CSP and the behaviour matches that of `header` CSP delivery, with the policy being written to the `metadata.cspReportOnly` property.
As a consequence, and like the delivery option itself, a report-only CSP is only available when using Vite.

**SSR:** report-only is delivered as a real `Content-Security-Policy-Report-Only` HTTP response header rather than the `metadata.cspReportOnly` property.
[`report-to`](#report-to) works as described above, with any generated [`Reporting-Endpoints`] emitted as a response header instead of being written to a metadata file.

```ts
export default {
  bundler: 'vite',
  buildType: 'ssr',
  cspEnabled: true,
  cspExtraScriptSrcHosts: ['https://third-party.example.com'],
  cspReportTo: ['csp-endpoint', 'https://report.example.com/csp'],
  cspReportOnlyEnabled: true,
  cspReportOnlyExtraScriptSrcHosts: ['https://report-only.example.com'],
  cspReportOnlyReportTo: 'csp-report-only-endpoint',
} satisfies SkuConfig;
```

A report-only CSP can be enabled or disabled independently of the standard CSP, and vice versa.

[`Content-Security-Policy-Report-Only`]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy-Report-Only
