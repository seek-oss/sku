# <%= data.appName %>

This project is powered by [sku](https://github.com/seek-oss/sku), [braid](https://github.com/seek-oss/braid-design-system) and built with [React](https://facebook.github.io/react).

It uses **Vite SSR**: full-document streaming and `hydrateRoot(document)` — not static `#app` hydrate.

> **Experimental — not for production.** Vite SSR is available for evaluation and testing. Do not use it in production yet.

Use `sku start` / `sku build` (not `sku start-ssr` / `sku build-ssr`).

## Getting Started

<%= data.gettingStartedDocs %>

## Workflow

Start a local development server:

```sh
$ <%= data.startScript %>
```

Run unit tests:

```sh
$ <%= data.testScript %>
```

Lint and format code:

```sh
$ <%= data.lintScript %>
$ <%= data.formatScript %>
```

Build assets for production:

```sh
$ <%= data.buildScript %>
```

Then run the production server:

```sh
$ node dist/server/server.js
```

See [Server rendering](https://seek-oss.github.io/sku/#/./docs/server-rendering) for Vite SSR docs.
