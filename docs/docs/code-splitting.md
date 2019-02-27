# Code Splitting

Code splitting is a great way to ensure each page of your app is as light as possible. sku uses [loadable-components](https://www.smooth-code.com/open-source/loadable-components/) for code splitting modules and React components. All of the features of [`@loadable/component`](https://www.smooth-code.com/open-source/loadable-components/docs/api-loadable-component/) are supported in sku without any extra configuration.

Here's an example of splitting out a React component into a separate chunk.

```js
// Make sure to import @loadable/component through sku
import loadable from 'sku/@loadable/component';

const AsyncComponent = loadable(() => import('./AsyncComponent'));

const MyComponent => () => (
  <div>
    <AsyncComponent />
  </div>
);
```

## Static/Server Rendering

If sku encounters an async component (`loadable-component`) during render, it will still render the component just like any other. This will also tell sku to include the required chunk for this import to work synchronously client side. This is great as it allows you to use many async components without showing loading indicators everywhere on your page.

## Code splitting by route

The most common use case for code splitting is splitting out each top level route component in your app. The following is an example of how to do this with [`react-router`](https://reacttraining.com/react-router/) but the concepts should apply to any routing solution.

```js
// sku.config.js
module.exports = {
  routes: ['/', '/details']
  publicPath: 'https://somecdn.com'
};
```

```js
// render.js
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';

import App from './App';

export default {
  renderApp: ({ SkuProvider, route }) => {
    return renderToString(
      <SkuProvider>
        <StaticRouter location={route} context={{}}>
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
};
```

```js
// client.js
import React from 'react';
import { hydrate } from 'react-dom';
import { BrowserRouter } from 'react-router-dom';

import App from './App';

export default () => {
  hydrate(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
    document.getElementById('app'),
  );
};
```

```js
// App.js
import React, { Fragment } from 'react';
import { Route } from 'react-router-dom';
import loadable from 'sku/@loadable/component';

const Home = loadable(() => import('./handlers/Home'));
const Details = loadable(() => import('./handlers/Details'));

export default ({ site }) => (
  <Fragment>
    <Route path="/" exact component={Home} />
    <Route path="/details" exact component={Details} />
  </Fragment>
);
```
