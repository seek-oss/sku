## Context

Create’s happy path is: generate files → `pnpm add` deps (including unversioned `sku`) → `sku format` (configure + eslint + prettier). Integration tests want that path for authenticity, but unversioned `sku` resolves to the published registry version, which breaks WIP create↔configure work.

The fixture `linkWorkspacePackages` approach fails once create writes a nested `pnpm-workspace.yaml` (child becomes its own workspace root). Override must live in the **dependency specifier**, not workspace layout.

Format is intentionally soft in production today (warn and continue). Create-time hard fail via `SKU_CREATE_STRICT` is out of scope — review feedback preferred no production code changes. Instead we'll use the new project’s lint after create instead.

Soft-mode create previously treated format exit code `1` as “warnings” and other non-zero codes as failures — a leftover from when Prettier/ESLint-style tools used distinct exit codes. After sku’s lint/format exit-code consolidation (seek-oss/sku#1607), `sku format` exits `1` for failures, so create was mis-labelling real errors as warnings.

## Goals / Non-Goals

**Goals:**

- Test-only way to install **this commit’s** sku via a dependency specifier override
- Specifier used at install time comes from the env (typically `sku@file:<absolute-path-to-.tgz>`) so it survives nested workspaces
- After create, harness runs the new project’s lint and it must pass
- Soft format stays warn-and-continue; messaging for exit `1` is corrected
- Simplify `sku-create` tests off the workspace-linking hack for sku resolution

**Non-Goals:**

- Public CLI for choosing sku
- `SKU_CREATE_STRICT` or any create-time hard fail on soft format failures
- Changing production soft format behaviour (remain warn-and-continue)
- Overriding braid/react/pnpm-plugin-sku
- start/build smoke test
- Skip-install / generate-only mode

## Decisions

### 1. Env var is the full sku dependency specifier

Tests pack `packages/sku` with `pnpm pack --pack-destination` pointed at a **unique** directory from `fs.mkdtemp` under `os.tmpdir()` (outside the monorepo), then pass a complete install specifier via an internal env var (`SKU_CREATE_SKU_SPECIFIER`). Create uses it as-is when set; otherwise installs unversioned `sku`. `os.tmpdir()` alone is a shared parent — never pack to a fixed path there; `mkdtemp` is what isolates parallel suites.

```ts
// install.ts (sketch)
const skuDep = process.env.SKU_CREATE_SKU_SPECIFIER ?? 'sku';
```

```ts
// sku-create.test.ts (sketch)
const packDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sku-create-pack-'));
const tgz = await packSku({ packDestination: packDir }); // absolute path to .tgz
await create(projectName, args, {
  env: {
    SKU_CREATE_SKU_SPECIFIER: `sku@file:${tgz}`,
  },
});
```

Do **not** pack into `packages/sku` or the fixture tree — that dirties the workspace and can confuse pnpm layout. Prefer `fs.mkdtemp(path.join(os.tmpdir(), 'sku-create-pack-'))` so each suite (including Vitest-parallel runs) gets its own dir; a bare shared `tmpdir` path would collide on the same `sku-<version>.tgz` name. This works locally and on GHA (`ubuntu-latest`); this repo already uses `mkdtemp` in other tests. Optional `afterAll` cleanup of the pack dir is fine; CI runners are ephemeral either way.

**Why not `SKU_CREATE_SKU_TGZ` + copy into the project?** That puts test plumbing (copy, basename, `file:./…` normalisation) in product code. A raw specifier override keeps create dumb; path/cwd concerns stay in the harness. Absolute `file:` still works with a nested project workspace.

**Why not `workspace:*` / `file:` to the package dir?** Nested project workspace yaml breaks workspace linking; directory `file:` is less like a real publish. Pack + `file:` tarball is the closest authentic install that still pins local sku.

### 2. Quality gate is post-create lint (not create-time strict)

Do **not** add `SKU_CREATE_STRICT` or make format hard-fail in create for tests. Production soft behaviour stays the only create behaviour: any non-zero format exit is a failure-style warning, then create continues.

After a successful create, the harness runs the new project’s lint (via the project’s package scripts / sku commands as the scaffold defines them). It MUST pass. That catches configure/lint/format breakage without changing create’s soft format contract.

```ts
// sku-create.test.ts (sketch)
await create(projectName, args, {
  env: { SKU_CREATE_SKU_SPECIFIER: `sku@file:${tgz}` },
});
await runProjectLint(projectDir); // must exit 0
```

If create already implemented `SKU_CREATE_STRICT`, remove it from product code and tests — prefer the post-create gate only.

### 3. Test harness owns pack + env; drop linkWorkspacePackages for sku

```ts
// sku-create.test.ts (sketch)
const packDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sku-create-pack-'));
const tgz = await packSku({ packDestination: packDir }); // once per suite
await create(projectName, args, {
  env: {
    SKU_CREATE_SKU_SPECIFIER: `sku@file:${tgz}`,
  },
});
```

Remove `packages: ['../../packages/*']` + `linkWorkspacePackages` used only to force local sku. Keep other fixture setup only if still needed (e.g. catalog); otherwise delete it.

### 4. Specifier env is internal / undocumented for consumers

No public flags. Name should read as sku-repo / create testing (`SKU_CREATE_SKU_SPECIFIER`). Comment at the read site; do not document in user-facing create docs. Do not introduce `SKU_CREATE_STRICT`.

## Risks / Trade-offs

| Risk                                            | Mitigation                                                                        |
| ----------------------------------------------- | --------------------------------------------------------------------------------- |
| Packed sku misses files / wrong `files` field   | Same pack path as publish; fail install loudly if broken                          |
| Pack step slows tests                           | Pack once per suite (`beforeAll`); cache path                                     |
| Pack output pollutes monorepo / fixture tree    | Always `--pack-destination` under `fs.mkdtemp` in `os.tmpdir()`, never repo paths |
| Parallel suites overwrite the same `.tgz` name  | `mkdtemp` per pack (not a fixed path under shared `tmpdir`)                       |
| Absolute `file:` left in created `package.json` | Test-only; existing version-ignoring snapshots; optionally assert specifier shape |
| Invalid / relative specifier from harness       | Harness responsibility: always pass an absolute `sku@file:…` path                 |
| Format soft in create but scaffold still broken | Post-create lint must pass                                                        |
| Other `@latest` deps still network-bound        | Accepted for this change; not the version-skew bug                                |

## Migration Plan

1. Land specifier override (default unset = unversioned `sku`)
2. Keep format soft; fix exit-`1` messaging; remove `SKU_CREATE_STRICT` if present
3. Update sku-create tests to pack + specifier env; after create, run lint; remove workspace link hack
4. No consumer-facing behaviour change when env unset; changeset only if needed — prefer none unless publish surface requires it

## Open Questions

(none — quality gate is post-create lint; create format stays soft)
