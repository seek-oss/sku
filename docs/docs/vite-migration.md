# Migration to `vite`

This document outlines the steps to migrate your `sku` project to use `vite` as the bundler.
The migration process is relatively straightforward and should not require any major changes to your codebase.

## Migrate to `sku/vite/loadable`

> If you're not using `sku/@loadable/component` you can skip this step.

### Update loadable import

If you're using `sku/@loadable/component` you have to migrate over to the new `sku/vite/loadable` entrypoint.

```diff
- import loadable from 'sku/@loadable/component';
+ import { loadable } from 'sku/vite/loadable';
```

We've provided a codemod to help you out with this process.
Note that it may have unexpected results, so please review the changes it makes.

```bash
pnpm dlx sku-codemod transform-vite-loadable .
# optionally, you can use the --dry and --print flag to see what changes will be made without actually modifying any files.
pnpm dlx sku-codemod transform-vite-loadable . --dry --print
```

### Update render entrypoint

In the `render.tsx` file you will need to update the `renderApp` function to use the new `renderToStringAsync` function.
This is required in order to use the new `loadable` entrypoint.
The new `loadable` entrypoint uses `React.Suspense` to handle the fallback and this requires the app to be rendered async.
See more [here](https://react.dev/reference/react-dom/server/renderToString#when-a-component-suspends-the-html-always-contains-a-fallback)

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

### Update server entrypoint

`sku` in `vite` mode does not support `ssr` rendering yet.
Stay tuned for server rendering support in the future.

## Change to ESM

In order to use `vite` as the bundler you will need to update your project to `esm`.
This can be done by changing the `type` field in your `package.json` file to `module`.

```diff
// package.json
{
+   "type": "module",
    "name": "my-project",
    ...
}
```

Once the project is updated to `esm` you will need to update your imports to use the new `import` syntax.
Any files that use `require` will need to be changed from `.js` to `.cjs`.
Dependencies may need to be updated to `esm` compatible versions.

### Jest support

`jest` does not [officially](https://jestjs.io/docs/ecmascript-modules) support `esm` yet.
In order to run `jest` or `sku test` you will need to use the `--experimental-vm-modules` flag to enable `esm` support.

## Update jsx file extensions.

In order to use `vite` as the bundler you will need to update your `.js` file extensions to `.jsx` files that contain `JSX`.
This is a requirement of `vite` and is not specific to `sku`.

## Update `sku.config.ts` file

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

There is currently no equivalent `dangerouslySetViteConfig` API available.
Support for this API may not be implemented unless there is good reason to do so.
