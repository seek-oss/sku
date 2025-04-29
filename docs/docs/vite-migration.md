## Migration guide for `vite`

This document outlines the steps to migrate your `sku` project to use `vite` as the bundler. The migration process is relatively straightforward and should not require any major changes to your codebase.

### Migrate to `sku/vite/loadable`

> [NOTE!]: If you're not using `sku/@loadable/component` you can skip this step.

#### Update loadable import

If you're using `sku/@loadable/component` you have to migrate over to the new `sku/vite/loadable` entrypoint.

```diff
- import loadable from 'sku/@loadable/component';
+ import { loadable } from 'sku/vite/loadable';
```

We've provided a migration script to help you out with this process. Note that it may have unexpected results, so please review the changes it makes.

```bash
# todo: command for migrating here
```

#### Update render entrypoint

In the `render.tsx` file you will need to update the `renderApp` function to use the new `renderToStringAsync` function. This is required in order to use the new `loadable` entrypoint. The new `loadable` entrypoint uses `React.Suspense` to handle the fallback and this requires the app to be rendered async. See more [here](https://react.dev/reference/react-dom/server/renderToString#when-a-component-suspends-the-html-always-contains-a-fallback)

```diff
- import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from './App';

export default {
-   renderApp: ({ SkuProvider, route, site }) => {
-     return renderToString(
+   renderApp: async ({ SkuProvider, route, site, renderToStringAsync }) => {
+     return await renderToStringAsync(
      <SkuProvider>
        <StaticRouter location={route} context={{}}>
          <App site={site} />
        </StaticRouter>
      </SkuProvider>,
    );
  },

  // the following options are unchanged.
  provideClientContext: ...,
  renderDocument: ...,
};
```

#### Update server entrypoint

`sku` in `vite` mode does not support `ssr` rendering yet. Stay tuned for server rendering support in the future.

### Change to ESM

In order to use `vite` as the bundler you will need to update your project to `esm`. This can be done by changing the `type` field in your `package.json` file to `module`.

```diff
// package.json
{
+   "type": "module",
    "name": "my-project",
    ...
}
```

### Update jsx file extensions.

In order to use `vite` as the bundler you will need to update your file extensions to `.jsx` or `.tsx` on files that contain JSX. This is a requirement of `vite` and is not specific to `sku`.

### Update `sku.config.ts` file

In order to use `vite` as the bundler you will need to update your `sku.config.ts` file to specify the `vite` bundler.
This can be done by adding the `__UNSAFE_EXPERIMENTAL__bundler` field to your config file and setting its value to `vite`.

```typescript
// sku.config.ts
import type { SkuConfig } from 'sku';

export default {
  __UNSAFE_EXPERIMENTAL__bundler: 'vite', // sku will use vite as the bundler.
  ...
} satisfies SkuConfig;
```

The `dangerouslySetWebpackConfig` option is not supported in `vite` and will be ignored.
We've currently got no means to change the vite config but are open to requests for this feature.

## Breaking Changes

`--strict-port`:
