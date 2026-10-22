## Why

Our deployment tool deploys from `dist/documents/<environment>` and `dist/resources`, and silently falls back to a flat legacy layout when they are missing.
Vite builds write HTML and assets into the same `dist` root (static) or `dist/client` (SSR), so they cannot use the subfolder layout.
Webpack output must stay as it is.

## What Changes

- New experimental option `__UNSAFE_EXPERIMENTAL__distSubfolders` (boolean, default `false`). It may be removed without notice in a non-major release.
- Static Vite builds with the option on write HTML to `dist/documents/` and assets (including `public/` files) to `dist/resources/`.
- `resources` is a reserved environment name when the option is on.
- A static build with the option on fails before building if `public/` contains `.html` files.
- `sku serve` serves both layouts: the legacy layout unchanged and the subfolder layout through `documents/` and `resources/`.
- Vite SSR always writes client assets to `dist/resources/` instead of `dist/client/`. `dist/server/` is unchanged. There is no option for SSR.
- The production SSR server mounts its optional static assets from sibling `resources/`.
- **BREAKING (experimental SSR only):** `dist/client/` is renamed to `dist/resources/`.
- The option fails config validation with `bundler: 'webpack'` and with `buildType: 'ssr'`.

## Non-goals

- Changing webpack output or making the layout the default for static Vite apps.
- Validating `transformOutputPath` results.
- Changing our deployment tool.
- Replacing `serve-handler` in `sku serve`.

## Capabilities

### New Capabilities

- `static-output-layout`: Static Vite builds can emit `documents/` and `resources/` subfolders behind an experimental option, and `sku serve` serves both layouts.

### Modified Capabilities

- `ssr`: Production build emits sibling `resources/` and `server/` instead of `client/` and `server/`, and the optional static mount reads from `resources/`.

## Impact

- `sku` config schema, types and context.
- Vite `createOutDir`, static and SSR plugins, prerender, public file copying, and `startProductionSsrServer`.
- `sku serve` rewrites.
- Docs: configuration and SSR deploy pages.
- Browser and node tests that assert on `dist/` paths.
- Sku minor changeset.
