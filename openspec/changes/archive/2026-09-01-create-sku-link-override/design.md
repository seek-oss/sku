## Context

See proposal.md for why. Create already installs sku from `SKU_CREATE_SKU_SPECIFIER` when set, otherwise unversioned `sku`. The sku-create suite currently packs `packages/sku` and passes `sku@file:<tarball>`. Nested `pnpm-workspace.yaml` in the created project still forbids resolving sku via parent workspace config (`linkWorkspacePackages` / `workspace:*`). The override must stay a **dependency specifier**.

## Goals / Non-Goals

**Goals:**

- Pin this commit’s sku in create tests without resolving sku’s workspace deps from the registry
- Keep the override as a specifier so nested project workspaces still work

**Non-Goals:**

- Changing create’s production install path or documenting `SKU_CREATE_SKU_SPECIFIER` for consumers
- Recursively packing / rewriting tarballs to point workspace deps at local `.tgz` files
- A pack/`files` assertion (that only retests that pnpm pack honours `files`)
- A local registry, `pnpm.overrides`, or generate-only / skip-install mode
- start/build smoke tests

## Decisions

### 1. Create tests use `link:`, not `file:` tarball

Harness sets `SKU_CREATE_SKU_SPECIFIER` to `sku@link:<absolute-path-to-packages/sku>`. Create already treats the env as a raw specifier, so product code does not change.

`link:` is still a specifier, so it survives the nested `pnpm-workspace.yaml` that broke workspace-layout linking. pnpm does not rewrite sku’s `workspace:` ranges against the registry, so unpublished sibling versions on a release branch do not fail install.

**Alternatives considered:**

| Approach                                                   | Why not                                                                                                              |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Keep packing sku only                                      | Same failure: packed `package.json` asks for unpublished `@sku-lib/vite` (and any future bumped workspace dep)       |
| Pack sku **and** rewrite workspace deps to nested tarballs | Works, but stacks more pack/unpack/rewrite on an already test-only override; slower; more code                       |
| `file:` to the package directory                           | Directory `file:` is a looser install than `link:`; `link:` is the usual pnpm way to consume a local package by path |
| Parent `workspace:*` / `linkWorkspacePackages`             | Nested project yaml becomes its own workspace root; already rejected in `create-sku-tarball-override`                |
| Skip create tests on `changeset-release/*`                 | Hides the skew instead of removing it                                                                                |

### 2. Do not pack at all in this change

Packing in create was the closest authentic publish install. It also caused the registry skew, leaked `sku@file:…` into generated `pnpm-workspace.yaml`, and was slower.

A follow-on test that packs sku and asserts the tarball matches `package.json` `files` is tautological: it checks that pnpm pack honours `files`, not that sku’s published contract is correct. Catching a missing runtime path would require installing or running the packed package (the original create-pack problem) or hard-coding required paths (a different, publish-oriented test). Out of scope.

Create snapshots MUST NOT encode pack-only artifacts (e.g. `onlyBuiltDependencies` keys for `sku@file:…`). Generated `pnpm-workspace.yaml` SHOULD match an end-user create (`sku: true` among only-built deps, not a tarball path).

### 3. Publish fidelity vs create authenticity

Create tests still run a real `pnpm add` of sku (linked) plus other `@latest` deps, then post-create lint. Isolated `node_modules` still constrains sku to declared deps. Residual difference: `node_modules/sku` is a symlink into the monorepo, so ancestor-directory config resolution can differ from a published install. A missing `files` entry is a publish concern, not a create-test concern.

## Risks / Trade-offs

| Risk                                            | Mitigation                                                                        |
| ----------------------------------------------- | --------------------------------------------------------------------------------- |
| Missing `files` entry ships                     | Accepted; publish is the gate. A pack-vs-`files` test would only retest pnpm      |
| `link:` sees the monorepo as an ancestor        | Post-create lint still must pass; do not treat pack-in-create as the quality gate |
| Absolute `link:` left in created `package.json` | Test-only; existing version-ignoring snapshots                                    |
| Other `@latest` deps still network-bound        | Unchanged; not this bug                                                           |

## Migration Plan

1. Point sku-create `SKU_CREATE_SKU_SPECIFIER` at `sku@link:<packages/sku>`
2. Remove pack helper, temp-dir cleanup, and `sku@file:` YAML scrubbing; update snapshots
3. No consumer migration; rollback is reverting the test changes

## Open Questions

(none)
