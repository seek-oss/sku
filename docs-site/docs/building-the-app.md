# Building the app

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
  initialPath: '/my-page'
};
```
