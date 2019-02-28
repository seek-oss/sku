# Server rendering

The default mode for sku is to statically render projects. However, Server-Side Rendering (SSR) can explicitly be turned on, both in development with hot module reloading for React, and in production.

First, you need to create a `sku.config.js` file, which will contain the following setup at minimum:

```js
module.exports = {
  clientEntry: 'src/client.js',
  serverEntry: 'src/server/server.js',
  public: 'src/public',
  publicPath: '/',
  target: 'dist',
  port: 3300,
  serverPort: 3301,
};
```

If you have an existing configuration, for example generated with `sku init`, you will need to replace the `render` entry point by a `server` entry point, and add port info as documented above.

Then, you need to create your `server` entry. Sku will automatically provide an [Express](https://expressjs.com/) server for the user. The entry point for SSR, `server`, is used to provide the following:

- a render callback
- optionally, any required middlewares, either one or an array
- optionally, a callback to run after the server starts, which receives the Express application instance as a parameter

This can be done as follows:

```js
import render from './render.js';
import middleware from './middleware';

export default ({ publicPath, headTags, bodyTags }) => {
  renderCallback: (req, res) => {
    res.send(render(publicPath, headTags, bodyTags));
  },
  middleware: middleware,
  onStart: app => {
    console.log('My app started 👯‍♀️!');
    app.keepAliveTimeout = 20000;
  }
};
```

Last but not least, please note that commands for SSR are different to the ones used normally:

- Use `sku start-ssr` to start your development environment. It uses both `port` and `serverPort` to spin up hot module reloading servers.
- Use `sku build-ssr` to build your production assets. You can then run `node ./dist/server.js`. Your server will run at `http://localhost:xxxx`, where `xxxx` is `serverPort`.
- Use `sku test-ssr` to test your application
