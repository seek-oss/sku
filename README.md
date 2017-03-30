# sku

Front-end development toolkit, powered by [Webpack](https://webpack.js.org/), [Babel](https://babeljs.io/), [CSS Modules](https://github.com/css-modules/css-modules), [Less](http://lesscss.org/) and [Jest](https://facebook.github.io/jest/).

Quickly get up and running with a zero-config development environment, or optionally add minimal config when needed. Designed for usage with [seek-style-guide](https://github.com/seek-oss/seek-style-guide), although this isn't a requirement.

This tool is heavily inspired by other work, most notably:
- [facebookincubator/create-react-app](https://github.com/facebookincubator/create-react-app)
- [insin/nwb](https://github.com/insin/nwb)
- [NYTimes/kyt](https://github.com/NYTimes/kyt)

## Getting Started

If you haven't already, create a new Node.js project via npm:

```bash
$ npm init
```

Install sku into your project as a dev dependency:

```bash
$ npm install --save-dev sku
```

Add sku scripts to your `package.json`:

```js
"scripts": {
  "start": "sku start",
  "test": "sku test",
  "build": "sku build"
}
```

For sku to work correctly, you need some initial source files. First, create a `src` directory:

```bash
$ mkdir src
```

Create a basic `src/render.js`, which is used to generate your `index.html` file:

```bash
$ touch src/render.js
```

Then add the following code to `src/render.js`:

```js
export default () => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <title>My Awesome Project</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="stylesheet" type="text/css" href="/style.css" />
    </head>
    <body>
      <div id="app"></div>
      <script type="text/javascript" src="/main.js"></script>
    </body>
  </html>
`;
```

Finally, add a basic `src/client.js`:

```bash
$ echo 'document.getElementById("app").innerHTML = "Hello world!"' >> src/client.js
```

To include static assets that aren't handled by Webpack (e.g. `favicon.ico`), you can create a `public` directory:

```bash
$ mkdir src/public
```

## Development Workflow

To start a local development server and open a new browser tab:

```bash
$ npm start
```

To run tests:

```bash
$ npm test
```

To build assets for production:

```bash
$ npm run build
```

## Testing

Anywhere inside your project, any file ending in `.test.js` will be included in an `npm test` run.

Since sku uses Jest as a testing framework, you can read the [Jest documentation](https://facebook.github.io/jest/) for more information on writing compatible tests.

## Configuration

If you need to configure sku, first create a `sku.config.js` file in your project root:

```bash
$ touch sku.config.js
```

While sku has a zero configuration mode, the equivalent manual configuration would look like this:

```js
module.exports = {
  entry: {
    client: 'src/client.js',
    render: 'src/render.js'
  },
  public: 'src/public',
  target: 'dist'
}
```

### Environment Variables

By default, `process.env.NODE_ENV` is handled correctly for you and provided globally, even to your client code.

Any other environment variables can be configured using the `env` option:

```js
module.exports = {
  ...
  env: {
    MY_ENVIRONMENT_VARIABLE: 'hello',
    ANOTHER_ENVIRONMENT_VARIABLE: 'world'
  }
}
```

Environment variables can be configured separately for development and production:

```js
module.exports = {
  ...
  env: {
    MY_ENVIRONMENT_VARIABLE: {
      development: 'hello',
      production: 'world'
    }
  }
}
```

### Monorepo Support

If you need to build multiple projects in the same repo, you can provide an array of config objects.

Note that you can only run a development server for a single project at a time, so each configuration must be given a unique name:

```js
module.exports = [
  {
    name: 'hello',
    entry: {
      client: 'src/pages/hello/client.js',
      render: 'src/pages/hello/render.js'
    },
    public: 'src/pages/hello/public',
    target: 'dist/hello'
  },
  {
    name: 'world',
    entry: {
      client: 'src/pages/world/client.js',
      render: 'src/pages/world/render.js'
    },
    public: 'src/pages/world/public',
    target: 'dist/world'
  }
]
```

You can then start the relevant project by name at development time:

```bash
$ npm start hello
```

## License

MIT License
