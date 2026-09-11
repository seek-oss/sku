# Code Splitting

Code splitting keeps each page of your app small.
A chunk is a separate file the bundler creates for a split module.
With the webpack bundler, sku uses [loadable-components](https://www.smooth-code.com/open-source/loadable-components/) for code splitting modules and React components.
sku supports all features of [`@loadable/component`](https://www.smooth-code.com/open-source/loadable-components/docs/api-loadable-component/) without extra configuration.

Here is an example that splits a React component into a separate chunk.

```js
// Make sure to import @loadable/component through sku
import loadable from 'sku/@loadable/component';

const AsyncComponent = loadable(() => import('./AsyncComponent'));

const MyComponent = () => (
  <div>
    <AsyncComponent />
  </div>
);
```

## Static/Server Rendering

If sku finds an async component (`loadable-component`) during render, it still renders the component like any other.
This also tells sku to include the required chunk so the import can run synchronously on the client.
You can then use many async components without loading indicators on every part of the page.

## Code splitting by route

The most common use of code splitting is to split each top-level route component in your app.
The following example uses [`react-router`](https://reacttraining.com/react-router/).
The same concepts should apply to any routing solution.

::: code-group

```js [sku.config.ts]
export default {
  routes: ['/', '/details'],
  publicPath: 'https://somecdn.com',
};
```

```tsx [render.tsx]
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import type { Render } from 'sku';

import App from './App';

export default {
  renderApp: ({ SkuProvider, route }) => {
    return renderToString(
      <SkuProvider>
        <StaticRouter location={route}>
          <App />
        </StaticRouter>
      </SkuProvider>,
    );
  },

  renderDocument: ({ app, bodyTags, headTags }) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>hello-world</title>
          ${headTags}
        </head>
        <body>
          <div id="app">${app}</div>
          ${bodyTags}
        </body>
      </html>
    `;
  },
} satisfies Render;
```

```tsx [client.tsx]
import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import App from './App';

export default () => {
  hydrateRoot(
    document.getElementById('app')!,
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );
};
```

```tsx [App.tsx]
import React, { Fragment } from 'react';
import { Routes, Route } from 'react-router';
import loadable from 'sku/@loadable/component';

const Home = loadable(() => import('./handlers/Home')); // [!code highlight]
const Details = loadable(() => import('./handlers/Details')); // [!code highlight]

export default ({ site }: { site: string }) => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/details" element={<Details />} />
  </Routes>
);
```

:::
