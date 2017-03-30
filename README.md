# sku

Front-end development toolkit, powered by [Webpack](https://webpack.js.org/), [Babel](https://babeljs.io/), [CSS Modules](https://github.com/css-modules/css-modules), [Less](http://lesscss.org/) and [Jest](https://facebook.github.io/jest/).

## Setup

```bash
$ npm install --save-dev sku
```

## Getting started

To create a project, in a fresh project directory:

```bash
$ mkdir src && echo 'document.write("Hello world!")' >> src/client.js
```

Create a static HTML render function by creating a new file called `src/render.js` with the following contents:

```js
export default () => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <title>My Awesome Project</title>
      <link rel="stylesheet" type="text/css" href="/style.css" />
    </head>
    <body>
      <script type="text/javascript" src="/main.js"></script>
    </body>
  </html>
`;
```

## Development workflow

To start a local development server:

```bash
$ sku start
```

To run tests:

```bash
$ sku test
```

To build assets:

```bash
$ sku build
```

## License

MIT License
