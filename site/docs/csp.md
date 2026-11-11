# Content Security Policy (CSP)

[CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) adds a security policy to your app.
For statically rendered apps, sku can generate a `script-src` policy for you automatically.
SSR apps have an extra step.

> [!NOTE]
> This feature is not available to libraries

## Setup

Set `cspEnabled: true` in your `sku.config.js`.

SSR apps set [`csp`](#ssr-policies) instead.

### Delivery

For **static apps**, the `cspDelivery` option controls how sku delivers the enforcing CSP.
Set it to one of two values:

- `tag`: sku embeds the CSP in the rendered HTML via a `<meta http-equiv="Content-Security-Policy" …>` tag.
  You do not need further action to enable the CSP.
  This is the default if you do not set `cspDelivery`.
- `header`: sku writes the CSP to a JSON file next to the rendered HTML (e.g. `index.html.json`) in the `metadata.csp` property.
  sku does not generate a `<meta http-equiv="Content-Security-Policy" …>` tag.
  You must take extra steps at deployment and/or request time.
  Those steps must return this property as a `Content-Security-Policy` header on the response for the rendered HTML.

`cspDelivery` applies to **Static** Vite apps only (`buildType` unset / `'static'`).
SSR always emits real HTTP CSP headers, and config validation fails if an SSR app sets `cspDelivery`.

### Extra Hosts

If you need to allow scripts that are only known on the client, add their URLs to the `cspExtraScriptSrcHosts` array in your `sku.config.js`.
This includes scripts loaded by tag managers.

SSR apps use [`extraSources`](#extra-sources) in `csp` instead.
Config validation fails if an SSR app sets `cspExtraScriptSrcHosts`.

### SSR policies <Badge type="tip" text="SSR" /> <Badge type="warning" text="experimental" />

SSR apps configure CSP with the `csp` option.
It has two peer policies:

- `enforced` sets the `Content-Security-Policy` header.
- `reportOnly` sets the [`Content-Security-Policy-Report-Only`] header.

```ts
export default {
  bundler: 'vite',
  buildType: 'ssr',
  csp: {
    enforced: {
      extraSources: {
        'script-src': ['https://cdn.example.com'],
        'connect-src': ['https://browser-intake-datadoghq.com'],
      },
      reportTo: 'https://csp.example.com/report',
    },
    reportOnly: true,
  },
} satisfies SkuConfig;
```

Each policy is `true` or an object with `extraSources` and `reportTo`.
`true` turns the policy on with sku's directives and nothing extra.
Leave a policy out to turn it off.

The policies don't inherit from each other.
In the example above, the report-only policy doesn't include `https://cdn.example.com` or report anywhere.
To use the same values in both, share a constant:

```ts
const policy = {
  extraSources: { 'connect-src': ['https://browser-intake-datadoghq.com'] },
  reportTo: 'https://csp.example.com/report',
};

export default {
  // ...
  csp: { enforced: policy, reportOnly: policy },
} satisfies SkuConfig;
```

The flat `csp*` options are not supported for SSR, and config validation fails if an SSR app sets one.
Each one has a replacement in `csp`:

| Flat option                        | `csp` replacement                           |
| ---------------------------------- | ------------------------------------------- |
| `cspEnabled`                       | `csp.enforced`                              |
| `cspExtraScriptSrcHosts`           | `csp.enforced.extraSources['script-src']`   |
| `cspReportTo`                      | `csp.enforced.reportTo`                     |
| `cspReportOnlyEnabled`             | `csp.reportOnly`                            |
| `cspReportOnlyExtraScriptSrcHosts` | `csp.reportOnly.extraSources['script-src']` |
| `cspReportOnlyReportTo`            | `csp.reportOnly.reportTo`                   |
| `cspDelivery`                      | none: SSR always uses headers               |

#### Extra sources

`extraSources` adds sources to individual directives of a policy.
It is a map from directive name to an array of sources.

The supported directives are:

- `script-src`
- `style-src`
- `img-src`
- `font-src`
- `connect-src`
- `frame-src`
- `media-src`
- `worker-src`
- `manifest-src`
- `form-action`

sku keeps its own sources for every directive, including `script-src` nonces and hashes, and appends your sources after them.
Some directives aren't in sku's default policy, for example `frame-src`.
If you configure one of those, sku emits it as `'self'` followed by your sources.
This matches the browser's fallback to `default-src 'self'`, so same-origin requests keep working.

Each directive is a separate permission, so list a host under every directive that needs it.
For example, a CDN that serves stylesheets, fonts and images, but no scripts:

```ts
const assetCdn = ['https://assets.example.com'];

export default {
  // ...
  csp: {
    enforced: {
      extraSources: {
        'style-src': assetCdn,
        'font-src': assetCdn,
        'img-src': assetCdn,
      },
    },
  },
} satisfies SkuConfig;
```

Sources can be origins (`https://cdn.example.com`), wildcard hosts (`https://*.example.com`) or schemes (`https:`, `data:`, `blob:`).
Config validation fails for:

- directives not in the list above, such as `default-src`, `base-uri` and `frame-ancestors`
- quoted sources, such as `'unsafe-inline'`, nonces and hashes
- a bare `*`
- schemes in `script-src`, such as `https:` or `data:`, which would allow scripts from any origin using that scheme

> [!WARNING]
> Every source you allow is a place the page may load from or send data to.
> This matters most for `connect-src`.
> If an attacker injects a script, it can send data to any `connect-src` origin.
> Allow specific origins rather than broad wildcards or schemes, and only the ones your app needs.

#### Reporting

`reportTo` is the absolute `http:` or `https:` URL that the browser sends a policy's violation reports to.
sku names the endpoints itself: `csp` for the enforced policy and `csp-report-only` for the report-only policy.
For each policy that sets `reportTo`, sku adds a [`report-to`] directive and an entry in the [`Reporting-Endpoints`] header:

```http
Content-Security-Policy: …; report-to csp
Content-Security-Policy-Report-Only: …; report-to csp-report-only
Reporting-Endpoints: csp="https://csp.example.com/report", csp-report-only="https://csp.example.com/report"
```

Each report says which policy it came from, so both policies can use the same URL.

### Report To

The `cspReportTo` option lets the browser capture CSP violation reports via the [Reporting API].
You can set this option as an _endpoint name_, a _URL_, or a tuple of both.
The outcome is:

- If you set only an _endpoint name_, sku includes that value in the CSP as the [`report-to`] directive.
  sku does not emit a [`Reporting-Endpoints`] header.
- If you set only a _URL_, sku generates an endpoint name automatically.
  sku includes that name in the CSP as the [`report-to`] directive.
  sku emits a [`Reporting-Endpoints`] header with the generated endpoint name and the URL you provided.
- If you set both an _endpoint name_ and a _URL_, sku includes the provided endpoint name in the CSP as the [`report-to`] directive.
  sku emits a [`Reporting-Endpoints`] header with both the provided endpoint name and URL.

For **static apps**, the `cspReportTo` option is only effective when you use the `header` [delivery option](#delivery).
sku writes an emitted [`Reporting-Endpoints`] header to the same JSON file in the `metadata.reportingEndpoints` property.

SSR apps set [`reportTo`](#reporting) on each policy in `csp` instead, as a URL only.

[Reporting API]: https://developer.mozilla.org/en-US/docs/Web/API/Reporting_API
[`report-to`]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/report-to
[`Reporting-Endpoints`]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Reporting-Endpoints

### Nonce Values

You can use [Nonce] values to permit inline scripts that the client generates.

> [!NOTE]
> The [Content Security Policy (CSP)] requires that scripts be declared ahead of time.
> For inline scripts this is typically done automatically.
> A hash of their content is calculated when they are created during the initial render.
> This ensures client environments run only authorised scripts.
>
> When the client creates a script dynamically it may not be possible to predict the required hash.
> In this case you can use a nonce.

> [!WARNING]
> Nonces are less safe than content hashes.
> Consider whether other options are available.
> Consider whether the risks are acceptable for your use-case.

#### SSR - Managed Data Mode <Badge type="tip" text="SSR" /> <Badge type="warning" text="experimental" />

SSR uses **at most one** CSP nonce per HTML response.
sku mints a nonce **only when explicitly requested**.
sku includes it in the CSP header **only if requested**.

The following request a nonce:

- sku itself, when attaching a `nonce` to React stream scripts (post-shell inline scripts that cannot be pre-hashed)
- Express middleware: `req.getCspNonce()` (mint-on-read.
  Later calls return the same value)
- React Router loaders/actions: `getCspNonce()` from `sku/runtime` (same store while sku is rendering)

All of those share one value for the response.
Known bootstrap script bodies are still allowed via sha256 hashes.

A `nonce` is not available in client code.
`getCspNonce` returns `undefined` if you call it from the browser.
Isomorphic code can still call it safely.

#### Webpack SSR / static apps <Badge type="info" text="Webpack SSR" />

`createUnsafeNonce`: Generates a random nonce value and returns it for use by the client. sku adds the nonce value to the generated [Content Security Policy (CSP)] tags.

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

sku does not handle the returned HTML in Webpack SSR apps.
You must register any extra scripts (scripts not created by sku).

In the `renderCallback` function, register all extra script tags (inline and external) via the `registerScript` function.

> [!IMPORTANT]
> If you use multi-part responses via the `flushHeadTags` API, register all scripts before you send the initial response.

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

You can enable a "report-only" Content Security Policy by setting `cspReportOnlyEnabled: true` in your `sku.config.js`.
This causes sku to generate a [`Content-Security-Policy-Report-Only`] header.

By default the report-only CSP has the same content as the standard CSP, including the same [extra hosts](#extra-hosts).
You can change this by setting the `cspReportOnlyExtraScriptSrcHosts` array in `sku.config.js` to the script URLs for the report-only CSP.
The report-only CSP also shares the same [reporting](#report-to) configuration as the standard CSP.
You can change that by setting the `cspReportOnlyReportTo` option.

SSR apps set `csp.reportOnly` instead, which doesn't share anything with the enforced policy.
See [SSR policies](#ssr-policies).

Unlike the standard CSP, a report-only CSP can only be delivered via an HTTP header, not via a `<meta http-equiv>` tag.
There is no explicit [delivery option](#delivery) for a report-only CSP.
The behaviour matches `header` CSP delivery.
sku writes the policy to the `metadata.cspReportOnly` property.
As a consequence, a report-only CSP is only available when using Vite.
The same limit applies to the delivery option itself.

A report-only CSP can be enabled or disabled independently of the standard CSP, and vice versa.

[`Content-Security-Policy-Report-Only`]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy-Report-Only
