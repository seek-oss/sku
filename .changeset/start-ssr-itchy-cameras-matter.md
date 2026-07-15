---
'sku': major
---

`start-srr`: SSR server now accessible via webpack dev server

When running `sku start-ssr`, users would previously access the SSR server directly. Static assets would then be loaded from the webpack dev server on a separate host.
`sku start-ssr` will now proxy requests from the webpack dev server to the consumer's app (the SSR server), allowing the dev server to act as a single entrypoint.

**BREAKING CHANGE**:

When starting the dev server consumers may notice some changes:

- A new port used when opening the browser window
- Changes to the path used when loading assets

See [Development server entry] for more information.

[Development server entry]: https://seek-oss.github.io/sku/#/./docs/server-rendering?id=development-server-entry
