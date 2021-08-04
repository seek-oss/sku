---
'sku': minor
---

Add `--stats` argument

You can now override the default webpack stats preset via the `--stats` option. This is useful for debugging warnings and build issues. You can pass any valid [webpack stats preset](https://webpack.js.org/configuration/stats/#stats-presets).

```bash
sku start --stats errors-warnings
```

The default values are as follows:

**start/start-ssr**: `summary`

**build/build-ssr**: `errors-only`
