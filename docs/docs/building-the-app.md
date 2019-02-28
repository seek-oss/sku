# Building the app

## First steps

You should have the following scripts in your `package.json`.

```js
{
  "scripts": {
    "start": "sku start" // or `sku start-ssr` for SSR projects
    "build": "sku build" // or `sku build-ssr` for SSR projects
  }
}
```

To start a local development server and open a new browser tab:

```bash
$ npm start
```

Out of the box sku will start your app with [webpack-dev-server](https://github.com/webpack/webpack-dev-server) on http://localhost:8080. However there a few options you can pass `sku.config.js` if needed.

```js
module.exports = {
  // The preferred port you want the server to run on. sku will automatically
  // find a free port if this one is busy.
  port: 5000,
  // Optional parameter to set the page to open when the
  // development server starts, defaults to your first route
  initialPath: '/my-page',
};
```

## Entry points

There are two main entry points for every sku app. The client entry, and the render entry. SSR apps will have a server entry instead of a render entry.

### Render

**Static render only**

The render entry is in charge of returning a string of HTML that represents each of your apps routes, sites & environments. You can think of it as a server render that runs at build time. For more info on how to do this see [static rendering](./docs/static-rendering.md).

### Server

**SSR only**

The server file has a similar responsibility to the render entry, except it deals with http requests rather than pre-configured values. You can also add things like router middleware.

sku currently uses [`express`](https://expressjs.com/) as it's SSR web server.

### Client

The client entry is the entrypoint for all your client side code (code that runs in the browser). This is where you'll want to hydrate your React application and configure any state management you may be using.

> If you need pass information between render and client (e.g. Config values) see [`provideClientContext`](./docs/static-rendering#provideclientcontext)

Example client entry

```js
import React from 'react';
import { hydrate } from 'react-dom';

import App from './App';

export default () => {
  hydrate(<App />, document.getElementById('app'));
};
```
