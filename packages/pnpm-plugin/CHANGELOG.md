# pnpm-plugin-sku

## 0.2.1

### Patch Changes

- Stop writing pnpm 10-only settings into `pnpm-workspace.yaml` ([#1699](https://github.com/seek-oss/sku/pull/1699))

  `ignorePatchFailures` and `packageManagerStrictVersion` were removed in pnpm 11, which is what `@sku-lib/create` pins for new apps. Leaving them in the default config made pnpm warn that the settings were unrecognized.

- Add `'@parcel/watcher': true` to `allowBuilds` ([#1710](https://github.com/seek-oss/sku/pull/1710))

## 0.2.0

### Minor Changes

- Add the following scopes to `minimumReleaseAgeExclude`: ([#1657](https://github.com/seek-oss/sku/pull/1657))
  - `@capsizecss/*`
  - `@vanilla-extract/*`
  - `@vocab/*`

## 0.1.0

### Minor Changes

- Update config set by the plugin ([#1574](https://github.com/seek-oss/sku/pull/1574))

- Provide an ESM entrypoint for PNPM v11 compatibility ([#1574](https://github.com/seek-oss/sku/pull/1574))

- Expose a `pnpm-plugin-sku/config` entrypoint that exports the default PNPM config used by the plugin ([#1574](https://github.com/seek-oss/sku/pull/1574))

  **EXAMPLE USAGE**:

  ```ts
  import { defaultConfig } from 'pnpm-plugin-sku/config';
  ```

## 0.0.3

### Patch Changes

- Fix typo in config property ([#1380](https://github.com/seek-oss/sku/pull/1380))

## 0.0.2

### Patch Changes

- Update `onlyBuiltDependencies` list, configure `ignoreBuiltDependencies` ([#1316](https://github.com/seek-oss/sku/pull/1316))
