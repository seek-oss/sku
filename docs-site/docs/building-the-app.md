# Building the app

To start a local development server and open a new browser tab:

```bash
$ npm start
```

or for SSR projects

```bash
$ npm start-ssr
```

To build assets for production:

```bash
$ npm run build
```

or for SSR projects

```bash
$ npm build-ssr
```

Out of the box sku will start your app with [webpack-dev-server](https://github.com/webpack/webpack-dev-server) on http://localhost:8080. However there a few options you can pass `sku.config.js` if needed.

```js
module.exports = {
  // A list hosts your app can run off while in the dev environment.
  hosts: ['dev.seek.com.au', 'dev.seek.co.nz'],
  // The port you want the server to run on
  port: 5000,
  // Optional parameter to set a page to open when the development server starts
  initialPath: '/my-page'
};
```

Note: The app will always run on localhost. The `hosts` option is only for apps that resolve custom hosts to localhost.
