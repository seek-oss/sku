[![Build Status](https://img.shields.io/travis/seek-oss/sku/master.svg?style=flat-square)](http://travis-ci.org/seek-oss/sku) [![npm](https://img.shields.io/npm/v/sku.svg?style=flat-square)](https://www.npmjs.com/package/sku) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release) [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square)](http://commitizen.github.io/cz-cli/) [![Styled with Prettier](https://img.shields.io/badge/styled%20with-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

<br />
<img src="logo/logo.png?raw=true" alt="sku" title="sku" width="147" height="79" />
<br />

Front-end development toolkit, powered by [Webpack](https://webpack.js.org/), [Babel](https://babeljs.io/), [CSS Modules](https://github.com/css-modules/css-modules), [Less](http://lesscss.org/), [ESLint](http://eslint.org/) and [Jest](https://facebook.github.io/jest/).

Quickly get up and running with a zero-config development environment, or optionally add minimal config when needed. Designed for usage with [seek-style-guide](https://github.com/seek-oss/seek-style-guide), although this isn't a requirement.

This tool is heavily inspired by other work, most notably:
- [facebookincubator/create-react-app](https://github.com/facebookincubator/create-react-app)
- [insin/nwb](https://github.com/insin/nwb)
- [NYTimes/kyt](https://github.com/NYTimes/kyt)

**WARNING: While this software is open source, its primary purpose is to improve consistency, cross-team collaboration and code quality at SEEK. As a result, it’s likely that we will introduce more breaking API changes to this project than you’ll find in its alternatives.**

## Features

### Modern Javascript (via [Babel](https://babeljs.io/))

Use `import`, `const`, `=>`, rest/spread operators, destructuring, classes with class properties, [JSX](https://facebook.github.io/react/docs/jsx-in-depth.html) and all their friends in your code.  It'll all just work, thanks to the following Babel plugins:

* [babel-preset-env](https://babeljs.io/docs/plugins/preset-env/)
* [babel-preset-react](https://babeljs.io/docs/plugins/preset-react/)
* [babel-preset-react-optimize](https://github.com/thejameskyle/babel-react-optimize)
* [babel-plugin-transform-object-rest-spread](https://babeljs.io/docs/plugins/transform-object-rest-spread/)
* [babel-plugin-transform-class-properties](https://babeljs.io/docs/plugins/transform-class-properties/)

### Locally Scoped CSS (via [CSS Modules](https://github.com/css-modules/css-modules) and [Less](http://lesscss.org/))

Import any `.less` file into your Javascript as a `styles` object and use its properties as class names.

For example, given the following Less file:

```less
.exampleWrapper {
  font-family: comic sans ms;
  color: blue;
}
```

You can then import the classes into your JavaScript code like so:

```js
import styles from './example.less';

export default () => (
  <div className={styles.exampleWrapper}>
    Hello World!
  </div>
);
```

### Static CSS-in-JS (via [css-in-js-loader](https://github.com/nthtran/css-in-js-loader))

You can import `.css.js` files into your components and use them exactly as you would a regular style sheet.  This is mostly useful when you want to take advantage of JavaScript to compose styles:

```js
import { standardWrapper } from 'theme/wrappers';
import { fontFamily } from 'theme/typography';
import { brandPrimary } from 'theme/palette';

export default {
  '.exampleWrapper': {
    ...standardWrapper,
    fontFamily: fontFamily,
    color: brandPrimary
  }
};
```

```js
import styles from './example.css.js';

export default () => (
  <div className={styles.exampleWrapper}>
    Hello World!
  </div>
);
```

### Unit and Snapshot Testing (via [Jest](https://facebook.github.io/jest/))

The `sku test` command will invoke Jest, running any tests in files named `*.test.js`, `*.spec.js` or in a `__tests__` folder.

Since sku uses Jest as a testing framework, you can read the [Jest documentation](https://facebook.github.io/jest/) for more information on writing compatible tests.

### Linting and Formatting (via [ESLint](http://eslint.org/) and [Prettier](https://github.com/prettier/prettier))

Running `sku lint` will execute the ESLint rules over the code in your `src` directory. You can see the ESLint rules defined for sku projects in [eslint-config-seek](https://github.com/seek-oss/eslint-config-seek).

Adding the following to your package.json file will enable the [Atom ESLint plugin](https://github.com/AtomLinter/linter-eslint) to work correctly with sku.

```js
"eslintConfig": {
  "extends": "seek"
}
```

Similarly, running `sku format` will reformat the JavaScript code in `src` using Prettier.

### Static Pre-rendering (via [static-site-generator-webpack-plugin](https://github.com/markdalgleish/static-site-generator-webpack-plugin))

Generate static HTML files via a webpack-compiled render function that has access to your application code. For example, when building a React application, you can pre-render to static HTML with React's [renderToString](https://facebook.github.io/react/docs/react-dom-server.html#rendertostring) function.

### [SEEK Style Guide](https://github.com/seek-oss/seek-style-guide) Support

Without any special setup, sku is pre-configured for the SEEK Style Guide. Just start importing components as needed and everything should just work out of the box.

## Getting Started

First, in a new directory, create a git repository with an appropriate `.gitignore` file:

```bash
$ git init
$ echo -e 'node_modules\nnpm-debug.log\ndist' >> .gitignore
```

Next, create a new Node.js project via npm:

```bash
$ npm init
```

Install sku into your project as a dev dependency:

```bash
$ npm install --save-dev sku
```

In `package.json`, delete the default test script:

```diff
-"scripts": {
-  "test": "echo \"Error: no test specified\" && exit 1"
-},
```

Replace the deleted test script with a basic set of sku scripts:

```js
"scripts": {
  "start": "sku start",
  "test": "sku test",
  "build": "sku build",
  "lint": "sku lint"
},
```

For sku to work correctly, you'll need some initial source files. First, create a `src` directory:

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
$ mkdir public
```

## Getting Started with React

Since sku was designed with static pre-rendering in mind, and provides [JSX](https://facebook.github.io/react/docs/jsx-in-depth.html) compilation out of the box, it's a perfect fit for [React](https://facebook.github.io/react).

If you'd like to start a new React project, first install the required dependencies:

```bash
$ npm install --save-dev react react-dom
```

Next, create a new file called `src/App/App.js`:

```bash
$ mkdir -p src/App
$ touch src/App/App.js
```

Add the following code to `src/App/App.js`:

```js
import React, { Component } from 'react';

export default class App extends Component {
  render() {
    return (
      <div>Hello world!</div>
    );
  }
};
```

Replace the contents of `src/render.js` with the following, which provides static pre-rendering of your React app:

```js
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './App/App';

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
      <div id="app">${renderToString(<App />)}</div>
      <script type="text/javascript" src="/main.js"></script>
    </body>
  </html>
`;
```

Finally, replace the contents of 'src/client.js' with the following:

```js
import React from 'react';
import { render } from 'react-dom';
import App from './App/App';

render(<App />, document.getElementById("app"));
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

If you need to specify a different config file you can do so with the `--config` parameter.

```bash
$ sku start --config sku.custom.config.js
```

_**NOTE:** The `--config` parameter is only used for dev (`sku start`) and build steps (`sku build`). Linting (`sku lint`), formatting (`sku format`) and running of unit tests (`sku test`) will still use the default config file and does **not** support it._

### Filename

Build artefacts are created according to the naming convention set by `outputFilename` and `outputCssFilename`.

Option | Default value
-------|-------
outputFilename | `[name].js`
outputCssFilename | `style.css`
publicPath | `/`

See [Webpack output.filename](https://webpack.js.org/configuration/output/#output-filename) for available filename conventions.

See [Webpack publicPath](https://webpack.js.org/guides/public-path/) for details on publicPath.

### Environment Variables

By default, `process.env.NODE_ENV` is handled correctly for you and provided globally, even to your client code. This is based on the sku script that's currently being executed, so `NODE_ENV` is `'development'` when running `sku start`, but `'production'` when running `sku build`.

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

Since this config is written in JavaScript, not JSON, you can easily pass through any existing environment variables:

```js
module.exports = {
  ...
  env: {
    BUILD_NUMBER: process.env.BUILD_NUMBER
  }
}
```

Environment variables can also be configured separately for development and production, plus any custom environments. The default environment for `sku build` is `production`, however you can select a custom environment to build your application by passing the command line argument `--env` (`-e` for shorthand). The environment is also passed to your code using `process.env.SKU_ENV`. Please note that these environments are not related to `NODE_ENV`.

`sku build --env testing`

```js
module.exports = {
  ...
  env: {
    API_ENDPOINT: {
      development: '/mock/api',
      testing: 'http://localhost/test/api',
      production: 'https://example.com/real/api'
    }
  }
}
```

Note: Running `sku start` will always use the `development` environment.

### Compile Packages

Sometimes you might want to extract and share code between sku projects, but this code is likely to rely on the same tooling and language features that this toolkit provides. A great example of this is [seek-style-guide](https://github.com/seek-oss/seek-style-guide). Out of the box sku supports loading the seek-style-guide but if you need to treat other packages in this way you can use `compilePackages`.

```js
module.exports = {
  compilePackages: ['awesome-shared-components']
}
```

Any `node_modules` passed into this option will be compiled through webpack as if they are part of your app.

### Locales

Often we render multiple versions of our application for different locations, eg. Australia & New Zealand. To render an HTML file for each location you can use the locales option in `sku.config.js`. Locales are preferable to [monorepos](#monorepo-support) when you need to render multiple versions of your HTML file but only need one version of each of the assets (JS, CSS, images, etc). Note: You can use `locales` inside a monorepo project.

The `locales` option accepts an array of strings representing each locale you want to render HTML files for.

```js
module.exports = {
  locales: ['AU', 'NZ']
}
```

For each locale, sku will call your `render.js` function and pass it the locale as a parameter.

```js
const render = ({ locale }) => (
  `<div>Rendered for ${locale}</div>`
)
```

The name of the HTML file that is generated will be suffixed by `-{locale}`.

eg.
```js
module.exports = {
  locales: ['AU', 'NZ']
}
```

will create `index-AU.html` & `index-NZ.html`.

Note: When running the app in dev mode only one HTML file will be created, defaulting to the first listed locale.

### Development server

Out of the box sku will start your app with [webpack-dev-server](https://github.com/webpack/webpack-dev-server) on http://localhost:8080. However there a few options you can pass `sku.config.js` if needed.

```js
module.exports = {
  // A list hosts your app can run off while in the dev environment.
  hosts: ['dev.seek.com.au', 'dev.seek.co.nz'],
  // The port you want the server to run on
  port: 5000
}
```

Note: The app will always run on localhost. The `hosts` option is only for apps that resolve custom hosts to localhost.

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

You will then be prompted to select the project you'd like to work on when starting your development server:

```bash
$ npm start
```

Alternatively, you can start the relevant project directly:

```bash
$ npm start hello
```

## Contributing

Refer to [CONTRIBUTING.md](./CONTRIBUTING.md). If you're planning to change the public API, please [open a new issue](https://github.com/seek-oss/seek-style-guide/issues/new) and follow the provided RFC template in the [GitHub issue template](.github/ISSUE_TEMPLATE.md).

## License

MIT License
