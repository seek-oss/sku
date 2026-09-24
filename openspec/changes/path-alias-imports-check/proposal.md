## Why

`sku configure` rewrites `package.json#imports` as a side effect. `configureProject` runs before most commands, so even `sku lint` mutates `package.json` while checking code. A check command should report drift, not fix it. Commands that resolve `#` imports at runtime should fail fast on drift instead of running against stale aliases.

## What Changes

- `syncPathAliasImports` gains a check mode: report drift instead of always writing.
- `sku configure` no longer writes `package.json#imports`.
- `sku lint` gains a "Path alias imports" check that fails when `package.json#imports` is out of sync with `pathAliases`, and suggests running `sku format`.
- `sku format` gains a "Path alias imports" step that syncs `package.json#imports` before ESLint and Prettier.
- `sku start`, `sku start-ssr`, `sku build`, `sku build-ssr`, and `sku test` fail fast on drift instead of healing the file silently. The error names the drift and directs the user to `sku format`.
- The check and fix run regardless of `skuSkipConfigure`.
- `sku serve`, `sku configure`, and `sku translations *` do not run the check. They never resolve `#` imports.

## Capabilities

### New Capabilities

- `path-alias-imports`: Keep `package.json#imports` in sync with `pathAliases`. Check in `sku lint`, fix in `sku format`, gate commands that resolve `#` imports at runtime.

## Impact

- `packages/sku/src/utils/pathAliasImports.ts`: split into shared core + sync/check/assert flavours.
- `packages/sku/src/utils/configureApp.ts`: imports sync step removed.
- `packages/sku/src/program/commands/lint/lint.action.ts` and `format/format.action.ts`: new entries in the `LintCheck[]` arrays.
- Entry points for `start`, `start-ssr`, `build` (webpack and vite handlers), `build-ssr`, and `test`: new assert call.
- Test fixtures using `pathAliases` must commit in-sync `package.json#imports`. Nothing heals them in tests anymore.
- Docs: `site/docs/linting.md`, `site/docs/cli.md`. Minor changeset describing the behavior change.
