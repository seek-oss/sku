# Debugging

Use these methods to debug issues in a sku app.

## Enable sku Logs

By default, sku's [debug] logs are disabled.
These logs can show sku's config resolution, package resolution, development-server routing, and more.
Pass the `--debug` flag to the `sku` CLI to enable them:

```sh
yarn sku start --debug
```

[debug]: https://www.npmjs.com/package/debug

## Webpack Stats

Use the `--stats` CLI argument for more detail about webpack warnings and errors.
This overrides the default [webpack stats preset]:

```sh
yarn sku start --stats=detailed
```

The default value of the `--stats` argument is as follows:

| sku command       | webpack stats preset |
| ----------------- | -------------------- |
| `start/start-ssr` | `summary`            |
| `build/build-ssr` | `errors-only`        |

[webpack stats preset]: https://webpack.js.org/configuration/stats/#stats-presets
