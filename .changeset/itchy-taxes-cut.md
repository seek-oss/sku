---
'sku': minor
---

SSR server now accessible via webpack dev server

When running `sku start` users would previously access the SSR server directly.
They would then load static assets from the webpack dev server on a separate host.

`sku start` will now proxy requests from the webpack dev server to the consumer's app. Allowing the dev server to act as a single entrypoint.

Starting the dev server consumers may notice some changes:

- A new port used when opening the browser window
- Changes to the path used when loading assets

See [Development server entry] for more information.

[Development server entry]: https://seek-oss.github.io/sku/#/./docs/server-rendering?id=development-server-entry
