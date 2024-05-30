# Getting Started

Create a new project and start a local development environment:

```bash
$ npx sku init my-app
$ cd my-app
$ npm start
```

By default, a new project's dependencies will be installed using the package manager it was run with.
This can be overridden via the `--packageManager` flag:

```bash
$ npx sku init --packageManager pnpm my-app
$ cd my-app
$ pnpm start
```
