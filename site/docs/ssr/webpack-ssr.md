# Webpack SSR

:::info Webpack SSR
This page describes sku’s **older method for server-side rendering** using Webpack.
For the new experimental Managed Data Mode SSR, see [Getting started](./).
:::

Webpack SSR uses a low-level API and custom `-ssr` commands (`sku start-ssr` / `sku build-ssr`).
You supply a `serverEntry` whose default export includes `renderCallback`.

## Minimal setup

```ts
import type { SkuConfig } from 'sku';

export default {
  clientEntry: 'src/client.tsx',
  serverEntry: 'src/server/server.tsx',
  public: 'src/public',
  publicPath: '/',
  target: 'dist',
  port: 3300,
  serverPort: 3301,
} satisfies SkuConfig;
```

Sku provides an [Express](https://expressjs.com/) server.
The `serverEntry` default export may provide `renderCallback`, optional `middleware`, and optional `onStart`:

```tsx
import type { Server } from 'sku';

import middleware from './middleware';
import template from './template';

export default (): Server => ({
  renderCallback: ({ SkuProvider, getBodyTags, getHeadTags }, req, res) => {
    const app = renderToString(
      <SkuProvider>
        <App />
      </SkuProvider>,
    );
    res.send(
      template({ headTags: getHeadTags(), bodyTags: getBodyTags(), app }),
    );
  },
  middleware,
  onStart: (app) => {
    console.log('My app started');
    app.keepAliveTimeout = 20_000;
  },
});
```

## Commands

These differ from Managed Data Mode SSR and Static apps:

- `sku start-ssr` — development; uses both `port` and `serverPort`
- `sku build-ssr` — production assets; run with `node ./dist/server.js` (listens on `serverPort`)
- `sku test` — tests

## Multi-part response

To return HTML at different times in the request, use `flushHeadTags` for head tags added since the previous call (typically from dynamic chunks):

```tsx
import type { Server } from 'sku';

import { followupResponseTemplate, initialResponseTemplate } from './template';
import middleware from './middleware';

export default (): Server => ({
  renderCallback: async (
    { SkuProvider, getBodyTags, flushHeadTags },
    req,
    res,
  ) => {
    res.status(200);
    // Call `flushHeadTags` early to retrieve whatever tags are available.
    res.write(initialResponseTemplate({ headTags: flushHeadTags() })); // [!code highlight]
    await Promise.resolve();

    const app = renderToString(
      <SkuProvider>
        <App />
      </SkuProvider>,
    );

    res.write(
      // Call `flushHeadTags` again just in case new tags are available.
      followupResponseTemplate({
        headTags: flushHeadTags(), // [!code highlight]
        bodyTags: getBodyTags(),
        app,
      }),
    );
    res.end();
  },
  middleware,
  onStart: (app) => {
    console.log('My app started');
    app.keepAliveTimeout = 20_000;
  },
});
```

## Multi-language support

When using multiple languages the browser will download the language as needed, which can delay first paint.
To ensure translations are available immediately, call `addLanguageChunk` from your render params:

```jsx
export async function serverRender({ SkuProvider, addLanguageChunk, appPath }) {
  const language = getLanguageFromPath(appPath);
  addLanguageChunk(language); // [!code highlight]
  return renderToString(
    <SkuProvider>
      <StaticRouter location={appPath}>
        <VocabProvider language={language}>
          <App />
        </VocabProvider>
      </StaticRouter>
    </SkuProvider>,
  );
}
```

Static rendering registers language chunks automatically.
Managed Data Mode SSR uses server-entry `getLanguage` instead — see [Multi-language](./multi-language.md).

## Development server entrypoint

On the Webpack SSR path, `sku start-ssr` starts two services:

- A dev server for static assets
- An SSR service running your app’s server code

The dev server is the single entrypoint and proxies non-asset requests to the SSR service (similar to a production reverse proxy, and avoiding CORS for client requests).
Managed Data Mode SSR uses a single port instead.

To proxy other traffic (for example APIs), use [Dev Server Middleware](../extra-features.md#devserver-middleware).

## See also

- [Migrate from Webpack SSR](./migrate-from-webpack-ssr.md) — move to Managed Data Mode
- [Getting started](./) — Managed Data Mode overview
- [Extra features](../extra-features.md#devserver-middleware) — `devServerMiddleware`
