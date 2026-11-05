## Why

`sku build` for Vite SSR leaves `dist/server` importing bare packages (`react`, `react-router`, `react-dom/server`, even sku's own `express`), so it only runs next to the app's `node_modules`.
Deploy tools that ship `dist/server` on its own in a container image, without a package install, crash with `ERR_MODULE_NOT_FOUND`, and apps cannot fix this because SSR rejects `dangerouslySetViteConfig`.

## What Changes

- `sku build` for SSR bundles all dependencies into `dist/server`. Node built-ins stay external.
- `sku start` is unchanged: dependencies stay external in development.
- The deploy contract is documented: `dist/client`, `dist/server/server.js` run with `node server.js` and nothing installed, the baked manifest inside `dist/server`, and `PORT`.
- Docs no longer tell consumers that production needs runtime `node_modules`.

SSR is experimental, so this is not marked breaking. Deploys that still ship `node_modules` keep working; the bundled server ignores them.

## Non-goals

- A consumer option to externalise packages. Exceptions belong to sku and are raised through sku-support.
- A build-time check that fails on leftover package imports. Consumers can't add externals, so the isolated-server test covers sku's own config. Add the check if sku ever ships an exception.
- Writing `dist/server/package.json` with `"type": "module"`. Node runs `server.js` as ESM through module syntax detection.
- Copying externalised packages into `dist/server/node_modules`. This waits until sku has a real exception that needs it.
- Building native addons for a target platform such as `linux/arm64`.
- APM agents that patch `require` (for example `dd-trace`). Their preload setup belongs to the deploy tool.
- Changing static Vite or webpack SSR output.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ssr`: The production server output runs without the app's `node_modules`, and deploy and Migrating docs describe that contract instead of requiring runtime `node_modules`.

## Impact

- `ssr` Vite plugin: for the SSR build environment, `resolve.noExternal: true`, cleared explicit externals, and `resolve.dedupe` for React singletons.
- `dist/server` gets bigger (all of React, React Router, Express and app dependencies).
- Docs: SSR deploy-to-production and Migrating pages.
- Tests: `ssr-data` and Braid SSR fixture tests that start `dist/server` from a copy with no `node_modules`.
- Sku minor changeset.
