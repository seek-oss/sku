# Debugging

Below are some strategies for debugging issues in your sku app.

## Enable sku Logs

By default, sku's [debug] logs are disabled.
These logs can offer insights into sku's config resolution, package resolution, dev server routing, and more.
They can be enabled by setting the `DEBUG` environment variable:

```sh
DEBUG="sku*" yarn sku start
```

[debug]: https://www.npmjs.com/package/debug

## Webpack Stats

For more detailed information about webpack warnings/errors, the `--stats` CLI argument can be used to override the default [webpack stats preset]:

```sh
yarn sku start --stats=detailed
```

The default values are as follows:

| sku command       | webpack stats value |
| ----------------- | ------------------- |
| `start/start-ssr` | `summary`           |
| `build/build-ssr` | `errors-only`       |

[webpack stats preset]: https://webpack.js.org/configuration/stats/#stats-presets
