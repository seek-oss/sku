## Why

When deploying web applications, different kinds of files are typically deployed separately:

- built client assets (e.g. `dist/client`)
- generated static site documents (e.g. `dist/rendered/<environment>`)

This is easier to do if each type is in its own folder.
Deployments can work with a flat structure that combines both, but that means guessing which files are which type.

## What Changes

- New option `distSubfolders` (boolean, default `false`). It will default to `true` in a future breaking change.
- Static builds, with either bundler, with the option on write HTML and metadata to `dist/rendered/` and assets (including `public/` files) to `dist/client/`.
- `client`, `rendered` and `server` are always reserved environment names.
- A static build with the option on fails before building if `public/` contains `.html` files.
- `sku serve` serves both layouts: the legacy layout unchanged and the subfolder layout through `rendered/` and `client/`.
- SSR output is unchanged: it already emits sibling `client/` and `server/`.
- The option fails config validation with `buildType: 'ssr'`.

## Non-goals

- Making the layout the default for static apps (that is a future breaking change).
- Validating `transformOutputPath` results.
- Requiring changes to deployment tools.
- Replacing `serve-handler` in `sku serve`.

## Capabilities

### New Capabilities

- `static-output-layout`: Static builds can emit `rendered/` and `client/` subfolders behind the `distSubfolders` option, and `sku serve` serves both layouts.

### Modified Capabilities

None.

## Impact

- `sku` config schema, types and context.
- Vite `createOutDir`, static plugins, prerender and public file copying.
- Webpack output paths, HTML emission and public file copying.
- `sku serve` rewrites.
- Docs: configuration page.
- Browser and node tests that assert on `dist/` paths.
- Sku minor changeset.
