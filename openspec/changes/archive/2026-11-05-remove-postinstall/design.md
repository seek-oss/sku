# Design: Remove postinstall

## Context

The published `postinstall` hook (`scripts/postinstall.js` → bundled
`src/postinstall.ts`) warns when sku is in `dependencies` (`hasSkuDep`), then
runs `configureApp` to write the generated project files. It skips when the
consumer sets `skuSkipPostInstall` / `skuSkipPostinstall`.

The same `configureApp` already runs before every command that configures and
via `sku configure`. The generated files are gitignored, so today the hook is
the only thing that materialises them between `install` and the first sku
command.

pnpm v10+ blocks dependency lifecycle scripts unless the package is
allowlisted (hence `allowBuilds: { sku: true }` in sku's recommended pnpm
settings). npm and yarn run the hook unconditionally.

## Goals / Non-Goals

**Goals:**

- Delete the published postinstall hook and its build machinery.
- Keep the devDependency warning, now surfaced from the configure path.
- Keep `sku create` projects fully configured with no changes to create.
- Uniform behaviour after install across npm, yarn, and pnpm.

**Non-Goals:**

- Changing what `configureApp` generates or which commands run it.
- The repo root `postinstall` script (Node target sync, internal tooling).
- Removing `sku` from the recommended pnpm `allowBuilds`.
- Editor mitigations for the window between install and the first command.

## Decisions

### Decision: Delete the hook outright rather than deprecate it

The hook's only unique effect is configuring projects between install and the
first command. Every command with a configure step runs the same logic again.
Keeping it as a no-op was rejected: it would leave dead machinery (`scripts/postinstall.js`, the bundled `postinstall.mjs` entry, skip flag parsing) in the package for no
benefit.

### Decision: Move the `hasSkuDep` warning into the configure path

The warning fires in `configureApp`, so it still surfaces on the first command
a project runs, slightly later than install. Dropping it was rejected:
misinstalled sku (a runtime dependency) still causes real problems, and the
check is cheap.

### Decision: Rely on create's existing `sku format` run

`createProject` runs `formatProject` after `installDependencies`, and
`formatAction` awaits `configureProject` first. New projects are fully
configured when `sku create` completes.

Soft edge: `formatProject` resolves even when format fails (format failure
must not fail create). The project is then unconfigured until the next sku
command. Accepted: the same is true today if postinstall fails.

### Decision: Remove the `skuSkipPostInstall` / `skuSkipPostinstall` flags

With no hook, the flags have nothing to gate. Consumers who set them already
skipped the hook, so they see no change. `skuSkipConfigure` is untouched.

## Risks / Trade-offs

- [Fresh clone opened in an editor before any sku command has no generated
  configs, so TS path aliases, ESLint, and Prettier are inactive] → Accepted.
  The window is brief (`sku start` is the usual first step) and heals itself.
  The release note tells teams to run any sku command after cloning.
- [Automation that reads generated configs right after install (e.g. a CI step
  running raw `tsc` or `eslint`) breaks] → Not treated as breaking. The
  changeset notes the fix: run `sku configure` (or any sku command) first.
- [The devDependency warning fires on first command rather than at install] →
  Accepted.
- [Stale generated files after a sku upgrade persist until the next sku
  command] → It heals itself. Any sku command regenerates them.

## Migration Plan

One PR removes the hook, its sources, and its build entry, with a sku minor
changeset. Typical projects need no action. Automation that reads generated
configs before running a sku command adds a `sku configure` step.

Rollback: revert the PR and re-release.

## Open Questions

- Drop `sku: true` from sku's recommended pnpm `allowBuilds` in the same
  release? Leaning toward no — harmless while present, and removal belongs to
  the pnpm workspace config capability.
