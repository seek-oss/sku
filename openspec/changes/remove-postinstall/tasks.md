# Tasks: Remove postinstall

## 1. Move the devDependency warning

- [x] 1.1 Move the `hasSkuDep` detection and "sku should be installed in devDependencies" banner from `packages/sku/src/postinstall.ts` into `packages/sku/src/utils/configureApp.ts`, reading the consumer's package.json via the existing cwd utilities
- [x] 1.2 Verify the warning prints (and the command still succeeds) when a fixture project lists `sku` under `dependencies`

## 2. Remove the postinstall hook

- [x] 2.1 Delete the `postinstall` script entry from `packages/sku/package.json`
- [x] 2.2 Delete `packages/sku/scripts/postinstall.js` and `packages/sku/src/postinstall.ts`
- [x] 2.3 Remove the `postinstall` entry from `packages/sku/tsdown.config.ts` and confirm the build no longer emits `dist/postinstall.mjs`
- [x] 2.4 Remove all parsing and handling of `skuSkipPostInstall` / `skuSkipPostinstall` (confirm no references remain anywhere in the repo)
- [x] 2.5 Leave the repo root `postinstall` (`node ./postinstall.js`, Node target sync) untouched

## 3. Verify dependent flows

- [x] 3.1 Run the create integration tests and confirm a newly created project contains `tsconfig.json`, `eslint.config.mjs`, and `.prettierrc` after `sku create` completes (via the `sku format` run after install)
- [x] 3.2 Confirm a fresh clone with no generated files is fully configured by the first command that runs configure (`sku lint` or `sku start`)
- [x] 3.3 Run the sku test suite (`pnpm test`) and fix any snapshots or fixtures referencing postinstall

## 4. Release

- [x] 4.1 Add a sku minor changeset describing the removal, the window between install and the first command, and the `sku configure` migration path for automation that reads generated configs before running a sku command
