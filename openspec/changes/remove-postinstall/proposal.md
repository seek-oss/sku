# Remove postinstall

## Why

Sku's published `postinstall` hook is redundant: every command that needs a
configured project already runs the same `configureApp` logic first. The hook
also behaves inconsistently across package managers — pnpm v10+ blocks
dependency lifecycle scripts unless `sku` is allowlisted, while npm and yarn
run it unconditionally. Removing it makes behaviour after install uniform and
deletes a moving part.

## What Changes

- Sku no longer ships a `postinstall` script. Generated project
  files (`tsconfig.json`, `eslint.config.mjs`, `.prettierrc`, managed
  `.gitignore`/`.prettierignore` blocks, `.ssl` certificate) are not
  materialised at install time. They appear on the first sku command that runs
  configure (or explicit `sku configure`).
- The "sku should be installed in devDependencies" warning (`hasSkuDep`) moves
  into the configure path.
- The `skuSkipPostInstall` / `skuSkipPostinstall` flags are removed.
  `skuSkipConfigure` is unaffected.
- `@sku-lib/create` needs no changes: its `sku format` run after install
  already configures new projects.

## Capabilities

### New Capabilities

- `project-configuration`: Which commands write sku's generated config files,
  and where the devDependency warning surfaces, now that no install hook
  exists.

### Modified Capabilities

- `create-project`: The `sku format` run after install is now the sole
  configurator of new projects. No behavioural change to create itself.

## Impact

- **Removed**: `postinstall` from `packages/sku/package.json` and
  `packages/sku/tsdown.config.ts`; `packages/sku/scripts/postinstall.js`;
  `packages/sku/src/postinstall.ts`.
- **Modified**: `packages/sku/src/utils/configureApp.ts` gains the
  devDependency warning.
- **Consumer impact**: Generated configs appear on the first sku command
  rather than at install. Automation that reads them earlier must run `sku
configure` first. pnpm projects no longer need `sku` in `allowBuilds`.
- **Unaffected**: The repo root `postinstall` (Node target sync) stays.
- Changesets: sku minor.
