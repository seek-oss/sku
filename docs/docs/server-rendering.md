# Server rendering

The default mode for sku is to statically render projects. However, Server-Side Rendering (SSR) can explicitly be turned on, both in development with hot module reloading for React, and in production.

First, you need to create a `sku.config.js` file, which will contain the following setup at minimum:

```ts
export default {
  clientEntry: 'src/client.js',
  serverEntry: 'src/server/server.js',
  public: 'src/public',
  publicPath: '/',
  target: 'dist',
  port: 3300,
  serverPort: 3301,
} satisfies SkuConfig;
```

If you have an existing configuration, for example generated with `sku init`, you will need to replace the `render` entry point by a `server` entry point, and add port info as documented above.

Then, you need to create your `server` entry. Sku will automatically provide an [Express](https://expressjs.com/) server for the user. The entry point for SSR, `server`, is used to provide the following:

- a render callback
- optionally, any required middlewares, either one or an array
- optionally, a callback to run after the server starts, which receives the Express application instance as a parameter

This can be done as follows:

```tsx
import template from './template';
import middleware from './middleware';
import type { Server } from 'sku';

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
  middleware: middleware,
  onStart: (app) => {
    console.log('My app started 👯‍♀️!');
    app.keepAliveTimeout = 20000;
  },
});
```

## Multi-part response

If you need to return HTML at different times in the request you can use `flushHeadTags` to retrieve only the new head tags since the previous call.

New head tags can be added during render, typically this is due to dynamic chunks being used during a render.

For example, you may want to send back an initial response before you are done rendering your response:

```tsx
import { initialResponseTemplate, followupResponseTemplate } from './template';
import middleware from './middleware';
import type { Server } from 'sku';

export default (): Server => ({
  renderCallback: ({ SkuProvider, getBodyTags, getHeadTags }, req, res) => {
    res.status(200);
    // Call `flushHeadTags` early to retrieve whatever tags are available.
    res.write(initialResponseTemplate({ headTags: flushHeadTags() }));
    await Promise.resolve();

    const app = renderToString(
      <SkuProvider>
        <App />
      </SkuProvider>,
    );

    res.write(
      // Call `flushHeadTags` again just in case new tags are available.
      followupResponseTemplate({
        headTags: flushHeadTags(),
        bodyTags: getBodyTags(),
        app,
      }),
    );
    res.end();
  },
  middleware: middleware,
  onStart: (app) => {
    console.log('My app started 👯‍♀️!');
    app.keepAliveTimeout = 20000;
  },
});
```

Last but not least, please note that commands for SSR are different to the ones used normally:

- Use `sku start-ssr` to start your development environment. It uses both `port` and `serverPort` to spin up hot module reloading servers.
- Use `sku build-ssr` to build your production assets. You can then run `node ./dist/server.js`. Your server will run at `http://localhost:xxxx`, where `xxxx` is `serverPort`.
- Use `sku test` to test your application

## Multi-language support

When using multiple languages the browser will download the language needed as required. However, this can lead to a delay in page load. To ensure translations are available immediately you need to tell sku what language you are rendering.

**Note:** This is handled automatically for static-rendering and is only required for server-side rendering.

To add the language to the initial render call `addLanguageChunk` from your render params.

**Example:** Using `addLanguageChunk` to set the language during server-render

```jsx
export async function serverRender({ SkuProvider, addLanguageChunk, appPath }) {
  const language = getLanguageFromPath(appPath);
  addLanguageChunk(language);
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

## Development server environment

When developing your application sku will start two services:

- A dev server responsible for serving the client assets (default: localhost:8080)
- An SSR service running your app's server code (Default: localhost:8181)

By default, sku will open your SSR server URL in a browser, sending asset requests (JS, CSS, etc) to the Dev Server.

### Single entrypoint with dev server as entry

sku now supports the ability to use the Dev Server as a single entry-point for your development environment.

When enabled with `devServerAsEntry` the Dev Server will proxy requests to your SSR Service.

This will better align to production environments, where a reverse proxy redirect asset, API or other requests to another service.
Avoiding the need to pass Cross-Origin Resource Sharing (CORS) checks when making requests from the client.

To include other requests, like typical API traffic, consider using the [Dev Server Middleware] to proxy these requests.

[Dev Server Middleware]: #/./docs/configuration?id=devservermiddleware
