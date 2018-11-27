[![Build Status](https://img.shields.io/travis/seek-oss/sku/master.svg?style=flat-square)](http://travis-ci.org/seek-oss/sku) [![npm](https://img.shields.io/npm/v/sku.svg?style=flat-square)](https://www.npmjs.com/package/sku) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release) [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square)](http://commitizen.github.io/cz-cli/) [![Styled with Prettier](https://img.shields.io/badge/styled%20with-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

<br />
<img src="logo/logo.png?raw=true" alt="sku" title="sku" width="147" height="79" />
<br />

Front-end development toolkit, powered by [Webpack](https://webpack.js.org/), [Babel](https://babeljs.io/), [CSS Modules](https://github.com/css-modules/css-modules), [Less](http://lesscss.org/), [ESLint](http://eslint.org/), [Prettier](https://prettier.io/), [Jest](https://facebook.github.io/jest/) and [Storybook](https://storybook.js.org/).

Quickly get up and running with a zero-config development environment, or optionally add minimal config when needed. Designed for usage with [seek-style-guide](https://github.com/seek-oss/seek-style-guide), although this isn't a requirement.

This tool is heavily inspired by other work, most notably:

- [facebookincubator/create-react-app](https://github.com/facebookincubator/create-react-app)
- [insin/nwb](https://github.com/insin/nwb)
- [NYTimes/kyt](https://github.com/NYTimes/kyt)

**WARNING: While this software is open source, its primary purpose is to improve consistency, cross-team collaboration and code quality at SEEK. As a result, it’s likely that we will introduce more breaking API changes to this project than you’ll find in its alternatives.**

## Getting Started

Create a new project and start a local development environment:

```bash
$ npx sku init my-app
$ cd my-app
$ npm start
```

Don't have [npx](https://www.npmjs.com/package/npx)?

```bash
$ npm install -g npx
```

## Features

### Modern Javascript (via [Babel](https://babeljs.io/))

Use `import`, `const`, `=>`, rest/spread operators, destructuring, classes with class properties, [JSX](https://facebook.github.io/react/docs/jsx-in-depth.html) and all their friends in your code. It'll all just work, thanks to the following Babel plugins:

- [@babel/preset-env](https://babeljs.io/docs/en/babel-preset-env/)
- [@babel/preset-react](https://babeljs.io/docs/en/babel-preset-react/)
- [@babel/preset-typescript](https://babeljs.io/docs/en/babel-preset-typescript)
- [@babel/plugin-proposal-object-rest-spread](https://babeljs.io/docs/en/babel-plugin-proposal-object-rest-spread)
- [@babel/plugin-proposal-class-properties](https://babeljs.io/docs/en/babel-plugin-proposal-class-properties)
- [babel-preset-react-optimize](https://github.com/thejameskyle/babel-react-optimize)

### TypeScript

TypeScript files (`.ts` and `.tsx`) are supported as part of your source code. You can also mix JavaScript with TypeScript allowing you to slowly convert your project to TypeScript over time. The `sku lint` script will report any type errors in your code.

Note: Test files do not support TypeScript.

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

export default () => <div className={styles.exampleWrapper}>Hello World!</div>;
```

### Static CSS-in-JS (via [css-in-js-loader](https://github.com/nthtran/css-in-js-loader))

You can import `.css.js` files into your components and use them exactly as you would a regular style sheet. This is mostly useful when you want to take advantage of JavaScript to compose styles:

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

export default () => <div className={styles.exampleWrapper}>Hello World!</div>;
```

### Unit and Snapshot Testing (via [Jest](https://facebook.github.io/jest/))

The `sku test` command will invoke Jest, running any tests in files named `*.test.js`, `*.spec.js` or in a `__tests__` folder.

Since sku uses Jest as a testing framework, you can read the [Jest documentation](https://facebook.github.io/jest/) for more information on writing compatible tests.

Note: `sku` will forward all command line args to `jest`.

Example running tests in watch mode:

```bash
$ sku test --watch
```

If you need to set up your test framework, you can provide a `setupTests` script in your config:

```js
module.exports = {
  setupTests: 'src/setupTests.js'
};
```

For example, if you're using [Enzyme](https://airbnb.io/enzyme/), your `setupTests` script would look like this:

```js
import 'jest-enzyme';
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });
```

### Linting and Formatting (via [ESLint](http://eslint.org/), [TSLint](https://palantir.github.io/tslint/) and [Prettier](https://github.com/prettier/prettier))

Running `sku lint` will execute the ESLint/TSLint rules over the code in your `src` directory, depending on the type of file. You can see the ESLint rules defined for sku projects in [eslint-config-seek](https://github.com/seek-oss/eslint-config-seek). Similarly you can see the TSLint rules defined in [tslint-config-seek](https://github.com/seek-oss/tslint-config-seek).

Adding the following to your package.json file will enable the [Atom ESLint plugin](https://github.com/AtomLinter/linter-eslint) to work correctly with sku.

```js
"eslintConfig": {
  "extends": "seek"
}
```

Running `sku format` will format all JavaScript and TypeScript files in your project using [Prettier](https://github.com/prettier/prettier). As changes to formatting are considered non-breaking, please ensure you run `sku format` after upgrading `sku`.

Files can be excluded from formatting by adding paths into the `.prettierignore` file.

### Static Pre-rendering (via [html-render-webpack-plugin](https://github.com/jahredhope/html-render-webpack-plugin))

Generate static HTML files via a webpack-compiled render function that has access to your application code. For example, when building a React application, you can pre-render to static HTML with React's [renderToString](https://facebook.github.io/react/docs/react-dom-server.html#rendertostring) function.

See the [static-rendering](./docs/static-rendering) docs for more detail.

### Component Explorer via [Storybook](https://storybook.js.org/)

Running `sku storybook` will open up a local component explorer, displaying all component instances declared in files named `*.stories.js`, for example:

```js
import { storiesOf } from 'sku/storybook';
import React from 'react';
import Button from './Button';

storiesOf('Button', module)
  .add('Primary', () => <Button variant="primary">Primary</Button>)
  .add('Secondary', () => <Button variant="secondary">Secondary</Button>);
```

_**NOTE:** To access the Storybook API, you should import from `sku/storybook`, since your project isn't depending on Storybook directly._

By default, Storybook runs on port `8081`. If you'd like to use a different port, you can provide it via the `storybookPort` option in `sku.config.js`:

```js
module.exports = {
  storybookPort: 9000
};
```

### [SEEK Style Guide](https://github.com/seek-oss/seek-style-guide) Support

Without any special setup, sku is pre-configured for the SEEK Style Guide. Just start importing components as needed and everything should just work out of the box.

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
  publicPath: '/',
  target: 'dist'
};
```

If you need to specify a different config file you can do so with the `--config` parameter.

```bash
$ sku start --config sku.custom.config.js
```

_**NOTE:** The `--config` parameter is only used for dev (`sku start`) and build steps (`sku build`). Linting (`sku lint`), formatting (`sku format`) and running of unit tests (`sku test`) will still use the default config file and does **not** support it._

### Code Splitting

At any point in your application, you can use a dynamic import to create a split point.

For example, when importing the default export from another file:

```js
import('./some/other/file').then(({ default: stuff }) => {
  console.log(stuff);
});
```

For dynamically loaded bundles to work in production, **you must provide a `publicPath` option in your sku config.**

For example, if your assets are hosted on a CDN:

```js
module.exports = {
  ...,
  publicPath: `https://cdn.example.com/my-app/${process.env.BUILD_ID}/`
};
```

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

### Polyfills

Since sku injects its own code into your bundle in development mode, it's important for polyfills that modify the global environment to be loaded before all other code. To address this, the `polyfills` option allows you to provide an array of modules to import before any other code is executed.

Note: Polyfills are only loaded in a browser context. This feature can't be used to modify the global environment in Node.

```js
module.exports = {
  ...,
  polyfills: [
    'promise-polyfill',
    'core-js/modules/es6.symbol',
    'regenerator-runtime/runtime'
  ]
}
```

### Source Paths

By default, sku expects your source code to be in a directory named `src` in the root of your project. If your source code needs to be arranged differently, you can provide a `srcPaths` array:

```js
module.exports = {
  ...,
  srcPaths: [
    'src',
    'docs/src'
  ]
}
```

### Compile Packages

Sometimes you might want to extract and share code between sku projects, but this code is likely to rely on the same tooling and language features that this toolkit provides. A great example of this is [seek-style-guide](https://github.com/seek-oss/seek-style-guide). Out of the box sku supports loading the seek-style-guide but if you need to treat other packages in this way you can use `compilePackages`.

```js
module.exports = {
  compilePackages: ['awesome-shared-components']
};
```

Any `node_modules` passed into this option will be compiled through webpack as if they are part of your app.

### Building a Library

If you need to build a UMD library instead of a web site, you can provide a `library` entry and `libraryName` option instead:

```js
modules.exports = {
  entry: {
    library: 'src/library.js',
    render: 'src/render.js'
  },
  libraryName: 'MyAwesomeLibrary'
};
```

Your `library` entry must export its public API via a default export:

```js
export default () => {
  console.log('Hello from my library!');
};
```

Note that, in this scenario, the `render` entry is only used to provide a development environment. No HTML will be generated when running `sku build`.

will create `index-AU.html` & `index-NZ.html`.

Note: When running the app in dev mode only one HTML file will be created, defaulting to the first listed locale.

### Development server

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

### Server-Side Rendering Support

The default mode for sku is to statically render projects. However, Server-Side Rendering (SSR) can explicitly be turned on, both in development with hot module reloading for React, and in production.

First, you need to create a `sku.config.js` file, which will contain the following setup at minimum:

```js
module.exports = {
  entry: {
    client: 'src/client.js',
    server: 'src/server/server.js'
  },
  public: 'src/public',
  publicPath: '/',
  target: 'dist',
  port: 3300,
  serverPort: 3301
};
```

If you have an existing configuration, for example generated with `sku init`, you will need to replace the `render` entry point by a `server` entry point, and add port info as documented above.

Then, you need to create your `server` entry. Sku will automatically provide an [Express](https://expressjs.com/) server for the user. The entry point for SSR, `server`, is used to provide a render callback and any additional middlewares to that server. You can provide either a single middleware or an array. This can be done as follows:

```js
import render from './render.js';
import middleware from './middleware';

export default ({ publicPath, headTags, bodyTags }) => {
  renderCallback: (req, res) => {
    res.send(render(publicPath, headTags, bodyTags));
  },
  middleware: middleware
};
```

Last but not least, please note that commands for SSR are different to the ones used normally:

- Use `sku start-ssr` to start your development environment. It uses both `port` and `serverPort` to spin up hot module reloading servers.
- Use `sku build-ssr` to build your production assets. You can then run `node ./dist/server.js`. Your server will run at `http://localhost:xxxx`, where `xxxx` is `serverPort`.
- Use `sku test-ssr` to test your application

## Contributing

Refer to [CONTRIBUTING.md](./CONTRIBUTING.md). If you're planning to change the public API, please [open a new issue](https://github.com/seek-oss/seek-style-guide/issues/new) and follow the provided RFC template in the [GitHub issue template](.github/ISSUE_TEMPLATE.md).

## License

MIT License
