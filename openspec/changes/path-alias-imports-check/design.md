## Context

`syncPathAliasImports` (in `packages/sku/src/utils/pathAliasImports.ts`) mirrors the `pathAliases` sku config option into `package.json#imports` so Node resolves subpath imports natively. `configureApp` calls it via `configureProject`, which runs before most commands. Consequences:

- `sku lint`, a check command, silently mutates `package.json`.
- Drift heals before anyone sees it, so nothing enforces that the committed file is current.
- Consumers of `#` imports (vite/webpack resolution, vitest/jest, Node for SSR) trust a file that may have been rewritten mid-command.

`lint` and `format` already model the check/fix split for Prettier (`check`/`write`) and ESLint (`check`/`fix`) via the shared `LintCheck[]` / `runLintChecks` machinery. This change plugs into it.

## Goals / Non-Goals

**Goals:**

- `sku lint` reports out-of-sync `package.json#imports` as a lint failure and never writes the file.
- `sku format` syncs `package.json#imports`.
- Commands that resolve `#` imports at runtime (`start`, `start-ssr`, `build`, `build-ssr`, `test`) fail fast on drift with an actionable message.
- Lint fails if and only if `sku format` would change the file (the Prettier `--check`/`--write` contract).
- `skuSkipConfigure` does not disable the check, fix, or gate.

**Non-Goals:**

- Changing what `pathAliases` supports or how bundlers/tsconfig consume it.
- Gating `serve`, `configure`, or `translations *`: they never resolve `#` imports.
- Semantic (order-insensitive) comparison (see Decisions).

## Decisions

### Decision 1: "Out of sync" means "sync would write" (whole-file string compare)

The check reuses sync's exact computation: parse `package.json`, set or delete `imports`, then `JSON.stringify(pkg, null, 2) + '\n'`. It fails when the result differs from the file on disk.

Rejected alternative: semantic compare of the `imports` field (order-insensitive, presence-only). Lint could then pass becuase the keys are in the right place, while `sku format` still rewrites the file because of key order or formatting, breaking the lint↔format contract.

Verified against sku's pinned toolchain: Prettier's `json` output is byte-identical to the stringify format, and `sortPackageJson` does not reorder `imports` subkeys. Once converged, the file stays converged.

External edits with non-standard formatting (e.g. 4-space indent) still fail, and rightly so: sync would rewrite them, and one `sku format` converges permanently.

Consequence: `imports` subkey order must match `pathAliases` definition order, since sync replaces the whole `imports` object.

### Decision 2: Run the lint check before commands that resolve `#` imports

This includes: `test` (vitest/jest resolution), `start`/`start-ssr` (dev server + SSR in Node), `build`/`build-ssr` (bundler resolution, both webpack and vite build handlers). Skip the check for commands that don't resolve `#` imports: `serve` (serves already-built output), `translations *` (operate on `.vocab` files), `configure` (writes config files only).

### Decision 3: Three flavours over one shared core in `pathAliasImports.ts`

- `syncPathAliasImports(pathAliases)`: unchanged behavior, used by `format`.
- `checkPathAliasImports(pathAliases): Promise<LintResult>`: prints the drifted entries plus `suggestScript('format')`, returns `{ exitCode: 0 | 1 }`, used by `lint`.
- `assertPathAliasImports(pathAliases)`: throws on drift with the same message, used by gated commands.

All three skip silently when no `package.json` exists in the cwd.

## Risks / Trade-offs

- [A fixture using `pathAliases` may have a drifted `package.json#imports` that the sync step silently healed until now] → Commit an in-sync `package.json#imports` for every such fixture. The e2e lint/format tests fail on any fixture still drifted, so they double as regression coverage.
- [Users upgrading mid-drift get new failures in `start`/`build`/`test`] → Accepted. Ships as a minor. The error names the drift and the one-command fix (`sku format`).

## Migration Plan

Users with drifted `package.json#imports` run `sku format` once. Rollback = revert the change.

## Open Questions

None.
