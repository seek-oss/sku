---
'sku': minor
---

Various improvements were made to sku's Vite support. However, it is still not production ready.

#### General

- Ensure bundled pre-render entrypoint has a consistent name, regardless of the configured `renderEntry`.
- Change render entrypoint file `api` to match that of `webpack` rendering.
- Add the `vite-tsconfig-paths` plugin. This allows `vite` to respect the base path and path aliases in the `tsconfig.json`.
- Support multi-language applications via Vocab.
- Enable `csp` functionality.

#### Build

- Ensure `publicPath` is prepended to asset URLs imported by Vanilla Extract stylesheets.
- Strip assertions during production build.
- All asset files now get added directly to the `dist` folder instead of being nested.
- Aligns `publicPath` logic to mimic Webpack behaviour.

#### Start

- Enabled `httpsDevServer`.
- Improved error handling during static render.
- Enabled `devServerMiddleware`.
- Opens default browser on server start.
- Force HTTP/1 when enabling https dev server.

#### Loadable

- The loadable code has been moved to `@sku-lib/vite`.
