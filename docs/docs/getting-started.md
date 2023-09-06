# Getting Started

Create a new project and start a local development environment:

```bash
$ npx sku init my-app
$ cd my-app
$ yarn start
```

By default, a new project's dependencies will be installed with the first supported package manager detected on your system.
Package managers are detected in the following order: `yarn` -> `pnpm` -> `npm`.
This can be overridden via the `--packageManager` flag:

```bash
$ pnpm dlx sku init --packageManager pnpm my-app
$ cd my-app
$ pnpm start
```
