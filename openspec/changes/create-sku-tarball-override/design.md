## Context

Create’s happy path is: generate files → `pnpm add` deps (including unversioned `sku`) → `sku format` (configure + eslint + prettier). Integration tests want that path for authenticity, but unversioned `sku` resolves to the published registry version, which breaks WIP create↔configure work.

The fixture `linkWorkspacePackages` approach fails once create writes a nested `pnpm-workspace.yaml` (child becomes its own workspace root). Override must live in the **dependency specifier**, not workspace layout.

Format is intentionally soft in production today (warn and continue). Tests still need format/configure failures to fail create without changing that default.

## Goals / Non-Goals

**Goals:**

- Test-only way to install **this commit’s** sku via a dependency specifier override
- Specifier used at install time comes from the env (typically `sku@file:<absolute-path-to-.tgz>`) so it survives nested workspaces
- Opt-in strict mode so soft failures (today: format) fail create in tests, without changing production defaults
- Simplify `sku-create` tests off the workspace-linking hack for sku resolution

**Non-Goals:**

- Public CLI for choosing sku
- Changing production format behaviour (remain warn-and-continue unless strict)
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
    SKU_CREATE_STRICT: '1',
  },
});
```

Do **not** pack into `packages/sku` or the fixture tree — that dirties the workspace and can confuse pnpm layout. Prefer `fs.mkdtemp(path.join(os.tmpdir(), 'sku-create-pack-'))` so each suite (including Vitest-parallel runs) gets its own dir; a bare shared `tmpdir` path would collide on the same `sku-<version>.tgz` name. This works locally and on GHA (`ubuntu-latest`); this repo already uses `mkdtemp` in other tests. Optional `afterAll` cleanup of the pack dir is fine; CI runners are ephemeral either way.

**Why not `SKU_CREATE_SKU_TGZ` + copy into the project?** That puts test plumbing (copy, basename, `file:./…` normalisation) in product code. A raw specifier override keeps create dumb; path/cwd concerns stay in the harness. Absolute `file:` still works with a nested project workspace.

**Why not `workspace:*` / `file:` to the package dir?** Nested project workspace yaml breaks workspace linking; directory `file:` is less like a real publish. Pack + `file:` tarball is the closest authentic install that still pins local sku.

### 2. `SKU_CREATE_STRICT` turns soft failures into hard failures

Production create leaves format soft (warn + continue, still report created). That stays the default when `SKU_CREATE_STRICT` is unset.

When `SKU_CREATE_STRICT` is set (truthy, e.g. `1`), create treats soft failures as create failures. Today the only soft path is `formatProject` (non-zero exit or spawn error always `resolve()`s). Under strict, those reject so create does not print success.

```ts
// format.ts (sketch)
const strict = Boolean(process.env.SKU_CREATE_STRICT);
child.on('close', (code) => {
  if (code === 0) return resolve();
  if (!strict) {
    // existing warn-and-continue behaviour
    return resolve();
  }
  reject(new Error(`format failed: ${code}`));
});
```

Name is create-scoped (`SKU_CREATE_STRICT`), not a global sku-wide switch. Hook is reusable if create gains other soft paths later; install/templates already hard-fail today.

Exact treatment of format exit code `1` (warnings vs errors) under strict should match what tests need to catch configure/format mistakes — prefer failing on any non-zero when strict.

### 3. Test harness owns pack + env; drop linkWorkspacePackages for sku

```ts
// sku-create.test.ts (sketch)
const packDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sku-create-pack-'));
const tgz = await packSku({ packDestination: packDir }); // once per suite
await create(projectName, args, {
  env: {
    SKU_CREATE_SKU_SPECIFIER: `sku@file:${tgz}`,
    SKU_CREATE_STRICT: '1',
  },
});
```

Remove `packages: ['../../packages/*']` + `linkWorkspacePackages` used only to force local sku. Keep other fixture setup only if still needed (e.g. catalog); otherwise delete it.

### 4. Env vars are internal / undocumented for consumers

No public flags. Names should read as sku-repo / create testing (`SKU_CREATE_SKU_SPECIFIER`, `SKU_CREATE_STRICT`). Comment at the read sites; do not document in user-facing create docs.

## Risks / Trade-offs

| Risk                                            | Mitigation                                                                        |
| ----------------------------------------------- | --------------------------------------------------------------------------------- |
| Packed sku misses files / wrong `files` field   | Same pack path as publish; fail install loudly if broken                          |
| Pack step slows tests                           | Pack once per suite (`beforeAll`); cache path                                     |
| Pack output pollutes monorepo / fixture tree    | Always `--pack-destination` under `fs.mkdtemp` in `os.tmpdir()`, never repo paths |
| Parallel suites overwrite the same `.tgz` name  | `mkdtemp` per pack (not a fixed path under shared `tmpdir`)                       |
| Absolute `file:` left in created `package.json` | Test-only; existing version-ignoring snapshots; optionally assert specifier shape |
| Invalid / relative specifier from harness       | Harness responsibility: always pass an absolute `sku@file:…` path                 |
| Tests forget `SKU_CREATE_STRICT`                | Set both envs in the create test helper / suite setup                             |
| Other `@latest` deps still network-bound        | Accepted for this change; not the version-skew bug                                |

## Migration Plan

1. Land specifier override + `SKU_CREATE_STRICT` (default unset = current soft format)
2. Update sku-create tests to pack + both envs; remove workspace link hack
3. No consumer-facing behaviour change when envs unset; changeset only if needed for the new internal hooks / incidental packaging — prefer none unless publish surface requires it
4. Unset envs = previous create behaviour

## Open Questions

- Under strict, confirm format exit `1` (prettier/eslint warnings) should fail create — likely yes for CI authenticity.
