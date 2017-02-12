# sku

SEEK front-end development toolkit.

## Setup

After cloning this project:

```bash
$ npm install
$ npm link
```

## Getting started

To create a project, in a fresh project directory:

```bash
$ mkdir src && echo 'document.write("Hello world!")' >> src/index.js
```

Create a static HTML render function by creating a new file called `src/render.js` with the following contents:

```js
export default () => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <title>My Awesome Project</title>
    </head>
    <body>
      <script type="text/javascript" src="main.js"></script>
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
