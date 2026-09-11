# Static rendering

## Scaffold a new app

Create a new Static app.
Then start a local development environment:

::: code-group

```sh [New directory]
$ pnpm dlx @sku-lib/create my-app --template=vite
$ cd my-app
$ pnpm start
```

```sh [Current directory]
$ pnpm dlx @sku-lib/create . --template=vite
$ pnpm start
```

:::

## What is a sku static app?

A client-side app cannot show content until the browser downloads, parses, and runs the JavaScript.
The user sees a blank white screen until that work finishes.
A loading indicator often follows while the app fetches data from the network.
To improve perceived performance, sku renders all static content of your app at build time.
Static content is everything that does not need an API call.
We call this static rendering.

## Configuration

The sku config contains options that are specific to routes.

```ts
export default {
  routes: ['/', '/details'],
  environments: ['development', 'production'],
  sites: ['australia', 'asia'],
  target: 'dist', // Optional, this is the default value
} satisfies SkuConfig;
```

> [!NOTE]
> `sku start` opens the first listed route by default.
> To change this, set the `initialPath` option.

`sku build` with the above config creates the following output in your target directory.

```text
├── development
│   ├── australia
│   │   ├── index.html
│   │   ├── details
│   │   |   ├── index.html
│   ├── asia
│   │   ├── index.html
│   │   ├── details
│   │   |   ├── index.html
├── production
│   ├── australia
│   │   ├── index.html
│   │   ├── details
│   │   |   ├── index.html
│   ├── asia
│   │   ├── index.html
│   │   ├── details
│   │   |   ├── index.html
├── [static-asset].{css,js,jpg,etc}
```

`environments`, `sites`, and `routes` are all optional.
They do not appear in the build output if you omit them.

> [!NOTE]
> `sku start` defaults to the first `environment` and `site` in your config if you provide them.
> You can select any environment with the `--environment` argument.
> Example: `sku start --environment production`

## Rendering

After you configure sku, the render entry must return the HTML that creates all the files above.
Set the render entry with `renderEntry`.
The default is `src/render.js`.

**Example render entry**

```tsx
import React from 'react';
import { renderToString } from 'react-dom/server';
import type { Render } from 'sku';

import App from './App';

export default {
  renderApp: ({ SkuProvider, environment, site, route }) =>
    renderToString(
      <SkuProvider>
        <App environment={environment} site={site} route={route} />
      </SkuProvider>,
    ),

  renderDocument: ({ app, bodyTags, headTags }) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>My Awesome Project</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        ${headTags}
      </head>
      <body>
        <div id="app">${app}</div>
        ${bodyTags}
      </body>
    </html>
  `,
} satisfies Render;
```

### renderApp

The `renderApp` function should return your application as an HTML string.
Apps usually call `React.renderToString` for this.
It can also return other values.
Examples include extracted meta information and CSS styles.

`renderDocument` receives anything `renderApp` returns.
Do not render the whole HTML document in `renderApp`.
Return only the HTML that React generates.

> [!IMPORTANT]
> Wrap your app with the `SkuProvider`.
> This is **required** for the app to work.

Sku calls `renderApp` once for each combination of settings in sku config.
The settings are `environment`, `site`, and `route`.

> [!NOTE]
> The `SkuProvider` watches your render for dynamic imports.
> Sku can then provide all the script tags this page needs on the client.

> [!NOTE]
> **Experimental:** `renderApp` provides a `renderToStringAsync` function parameter.
> You can use it instead of calling `React.renderToString`.
> See [Supporting React Suspense].

### provideClientContext

`provideClientContext` is an optional function that runs after `renderApp`.
It passes context from the static render to the client code.
Use it for config values such as API endpoints and feature switches.
Use it for state such as redux state.
Sku passes the object this function returns to the client entry.

The function receives `environment`, `site`, and the result of `renderApp`.

::: code-group

```tsx{21-25} [render.tsx]
import React from 'react';
import { renderToString } from 'react-dom/server';
import type { Render } from 'sku';

import App from './App';

export default {
  renderApp: ({ SkuProvider, environment, site, route }) => {
    const html = renderToString(
      <SkuProvider>
        <App environment={environment} site={site} route={route} />
      </SkuProvider>,
    );

    return {
      html,
      appLength: html.length, // <- arbitrary example
    };
  },

  provideClientContext: ({ site, environment, app }) => ({
    site,
    analyticsEnabled: environment === 'production',
    appLength: app.appLength,
  }),

  renderDocument: ({ app, bodyTags, headTags }) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>My Awesome Project</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        ${headTags}
      </head>
      <body>
        <div id="app">${app}</div>
        ${bodyTags}
      </body>
    </html>
  `,
} satisfies Render;
```

```tsx [client.sx]
import React from 'react';
import { hydrateRoot } from 'react-dom/client';

import App from './App';

// The return type of `provideClientContext` in your render entry
type ClientContext = {
  site: string;
  analyticsEnabled: boolean;
  appLength: number;
};

export default ({ site, analyticsEnabled, appLength }: ClientContext) => {
  console.log('HTML source length', appLength);

  hydrateRoot(
    document.getElementById('app')!,
    <App site={site} analytics={analyticsEnabled} />,
  );
};
```

:::

### renderDocument

Sku calls `renderDocument` after `renderApp`.
It receives all the same values as `renderApp`, plus the following.
It must return a full HTML document.

- `app` - the value returned from the `renderApp` function
- `headTags` - html tags to be placed in the head of the html
- `bodyTags` - html tags to be placed at the **end** of the html body

## Supporting React Suspense

[React Suspense][react suspense documentation] lets renders finish asynchronously.
The render waits for modules or data to become available.
If this happens during static rendering, [renderToString] throws an error. [renderToString] expects the render to finish immediately.
To avoid this error you have a few options:

1. Never suspend a component during an initial render.
   One option is to skip React Suspense.
   The other option is to wait until after hydration before you use suspended components.
2. Use [renderToPipeableStream] in your `renderApp` function.
   Wait for the stream to end.
   Then return all the HTML at once.
3. **Experimental:** sku provides a `renderToStringAsync` function to your `renderApp` function.
   It performs option 2 for you.

Regardless of how you support it, consider that [Suspense][react suspense documentation] is a new feature for React.
Its APIs and use are changing quickly.
It is partially undocumented.
See [Note on Suspense-enabled data sources].

::: details Quote from the React Suspense documentation
"Suspense-enabled data fetching without the use of an opinionated framework is not yet supported.
The requirements for implementing a Suspense-enabled data source are unstable and undocumented.
An official API for integrating data sources with Suspense will be released in a future version of React." - [React Suspense Documentation]
:::

**Example `renderApp`'s `renderToStringAsync` parameter**

```tsx{12,14}
import React from 'react';
import type { Render } from 'sku';

import App from './App';

export default {
  renderApp: async ({
    SkuProvider,
    environment,
    site,
    route,
    renderToStringAsync,
  }) => {
    const html = await renderToStringAsync(
      <SkuProvider>
        <App environment={environment} site={site} route={route} />
      </SkuProvider>,
    );

    return {
      html,
    };
  },
  // ...
} satisfies Render;
```

[react suspense documentation]: https://react.dev/reference/react/Suspense
[renderToString]: https://react.dev/reference/react-dom/server/renderToString
[renderToPipeableStream]: https://react.dev/reference/react-dom/server/renderToPipeableStream
[note on suspense-enabled data sources]: https://react.dev/reference/react/Suspense#displaying-a-fallback-while-content-is-loading
[renderApp]: #renderApp
[supporting react suspense]: #supporting-react-suspense

## Common use cases

### TypeScript

If your app uses TypeScript, sku provides the type definitions for the render entry:

```tsx
import React from 'react';
import { renderToString } from 'react-dom/server';
import type { Render } from 'sku';
import App from './App';

interface RenderContext {
  html: string;
  otherThing: number;
}

export default {
  renderApp: () => ({
    html: renderToString(<App />),
    otherThing: 10,
  }),

  renderDocument: ({ app, headTags, bodyTags }) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>My Awesome Project</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        ${headTags}
      </head>
      <body>
        <div id="app">${app.html}</div>
        ${bodyTags}
      </body>
    </html>
  `,
} satisfies Render<RenderContext>; // [!code highlight]
```

### React Helmet

[React Helmet](https://github.com/nfl/react-helmet) needs extra work after React finishes rendering.
That work extracts static meta information.
Some other libraries use the same pattern.
Examples include [react-loadable](https://github.com/jamiebuilds/react-loadable) and [emotion](https://emotion.sh/docs/ssr).

```tsx
import React from 'react';
import ReactDOM from 'react-dom/server';
import Helmet from 'react-helmet';
import type { Render } from 'sku';

import App from './App/App';

export default {
  renderApp: () => {
    const appHtml = ReactDOM.renderToString(<App />);
    const helmet = Helmet.renderStatic();

    const htmlAttributes = helmet.htmlAttributes.toString();
    const bodyAttributes = helmet.bodyAttributes.toString();
    const metaStrings = [
      helmet.title.toString(),
      helmet.meta.toString(),
      helmet.link.toString(),
    ];
    const metaHtml = metaStrings.filter(Boolean).join('\n    ');

    return {
      appHtml,
      metaHtml,
      htmlAttributes,
      bodyAttributes,
    };
  },
  renderDocument: ({ app, bodyTags, headTags }) => `
    <!DOCTYPE html>
    <html${app.htmlAttributes ? ` ${app.htmlAttributes}` : ''}>
      <head>
        ${app.metaHtml}
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        ${headTags}
      </head>
      <body${app.bodyAttributes ? ` ${app.bodyAttributes}` : ''}>
        <div id="app">${app.appHtml}</div>
        ${bodyTags}
      </body>
    </html>
  `,
} satisfies Render;
```

### Dynamic routes

Apps can also use params in their path. `/job/[12345]` is one example.
In sku, write these params as `/job/$id`.
The `$` marks that part of the path as dynamic.

```ts
export default {
  routes: ['/', '/job/$id'],
} satisfies SkuConfig;
```

When you run `sku start`, a request to `/job/123` returns the rendered HTML for `/job/$id`. `sku build` writes the following folder structure.

```text
├── index.html
├── job
│   ├── $id
│   │   ├── index.html
├── [static-asset].{css,js,jpg,etc}
```

> [!WARNING]
> Sku supports this behaviour.
> Your web server must also route dynamic paths to the correct static file for that route.
> Because of this, some teams skip static rendering for these routes to reduce complexity.
