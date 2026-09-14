# Building the app

## First steps

Your `package.json` should contain these scripts.

```json
{
  "scripts": {
    "start": "sku start",
    "build": "sku build"
  }
}
```

To start a local development server and open a new browser tab:

```sh
$ npm start
```

By default, sku starts your app with [webpack-dev-server](https://github.com/webpack/webpack-dev-server) on `http://localhost:8080`.
You can pass a few options in `sku.config.js` if you need them.

```js
export default {
  // The preferred port you want the server to run on. sku will automatically
  // find a free port if this one is busy.
  port: 5000,
  // Optional parameter to set the page to open when the
  // development server starts, defaults to your first route
  initialPath: '/my-page',
};
```

## Entry points

Every sku app has two main entry points: the client entry, and the render entry.
SSR apps have a server entry instead of a render entry.

### Render

**Static render only**

The render entry returns a string of HTML for each of your app's routes, sites, and environments.
You can treat it as a server render that runs at build time.
For more information, see [static rendering](./static-rendering.md).

### Server

**SSR only**

The server file has a similar job to the render entry.
It handles HTTP requests rather than pre-configured values.
You can also add router middleware.

sku currently uses [`express`](https://expressjs.com/) as its SSR web server.

### Client

The client entry is the entry point for all your client-side code.
Client-side code runs in the browser.
Hydrate your React application here.
Configure any state management you may use.

> [!NOTE]
> If you need to pass information between render and client (e.g. config values), see [`provideClientContext`](./static-rendering#provideclientcontext)

Example client entry

```tsx
import React from 'react';
import { hydrateRoot } from 'react-dom/client';

import App from './App';

export default () => {
  hydrateRoot(document.getElementById('app')!, <App />);
};
```
