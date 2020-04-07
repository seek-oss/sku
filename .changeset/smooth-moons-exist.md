---
'sku': minor
---

Add sku serve command

The `sku serve` command adds the abilty to view the output of `sku build` without deploying to an environment. This is helpful for:

- Debugging production build only issues
- Running integration tests
- Viewing the app on legacy browsers (that require `sku build` only features)
- Performance testing

[Site/host routing](https://seek-oss.github.io/sku/#/./docs/multi-site?id=switching-site-by-host) works the same as `sku start`. However, you can set your preferred site via the `--site` argument. e.g. `sku serve --site seekAnz`. By default the first site is used.

You can specify which [environment](https://seek-oss.github.io/sku/#/./docs/configuration?id=environments) you want to serve via the `--environment` argument. e.g. `sku serve --environment production`. By default the first environment is used.

**Note**: `sku serve` does not work for apps that use a different domain for their [publicPath](https://seek-oss.github.io/sku/#/./docs/configuration?id=publicpath). 