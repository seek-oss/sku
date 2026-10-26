---
'sku': minor
---

Add `distSubfolders` option

When set to `true`, build output is split into a subfolder per kind of file, instead of writing everything to the root of `dist`:

- Static apps (Vite or webpack): `sku build` writes HTML documents to `dist/rendered` and every other file (including files from `public`) to `dist/client`.
- Webpack SSR apps: `sku build-ssr` writes client assets (including files from `public`) to `dist/client` and the server bundle to `dist/server`.

`sku serve` serves both the default and subfolder static layouts.

The option is rejected with `buildType: 'ssr'`, whose output is already split into `dist/client` and `dist/server`.
When it is enabled, `public` must not contain `.html` files.

This option defaults to `false`, and will default to `true` in a future major release.

`client`, `rendered` and `server` are now reserved and can't be used as `environments` names, regardless of whether the option is enabled.
