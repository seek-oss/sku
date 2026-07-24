# Design: eslint-tsconfig-references

`import-x/no-duplicates` alone takes **101.4s**, and all `import-x/*` rules combined account for 99.3% of rule time, confirming the resolver is the bottleneck. The current `project: '**/*/tsconfig.json'` glob matches 97 tsconfigs (45 after the `node_modules` ignore), and 35 of those are fixtures eslint never lints. The multi-project code path never caches because the cache is keyed by `configFile`, which stays `undefined` when `project` matches more than one tsconfig, so the resolver ends up re-running this glob 960 times per run.

## Architecture Decisions

### Decision: A `tsconfig.eslint.json` at repo root

A new file, not a modification of the root `tsconfig.json` (which `lint:tsc` uses as a catch-all typecheck):

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.json" },
    { "path": "./packages/sku/tsconfig.json" },
    { "path": "./packages/codemod/tsconfig.json" },
    { "path": "./packages/create/tsconfig.json" },
    { "path": "./packages/vite/tsconfig.json" },
    { "path": "./packages/pnpm-plugin/tsconfig.json" },
    { "path": "./packages/babel-plugin-display-name/tsconfig.json" },
    { "path": "./private/utils/tsconfig.json" },
    { "path": "./private/inject-changelog-preamble/tsconfig.json" },
    { "path": "./private/react-lib-with-loadable/tsconfig.json" }
  ]
}
```

The `files: []` + `references` shape compiles nothing itself, and serves only as an entry point the resolver reads as a single `configFile` and walks via `references: 'auto'` to find the 9 real projects.

Alternatives considered and rejected:

- `noWarnOnMultipleProjects: true` hides the warning but leaves the uncached scans and avoidable loads in place.
- Narrowing the glob to exclude fixtures reduces matches but still re-runs uncached, so it is incomplete.
- A full migration to project references (adding `composite: true` to every package's own tsconfig, and switching `lint:tsc` from `tsc` to the incremental `tsc --build`) is the biggest win, but it's high impact: `composite` is strict and several packages lack `rootDir`, which would surface new typecheck errors unrelated to eslint. It's rejected here as a potential separate, larger change.

### Decision: Point resolver at it via `tsconfig.configFile`

```js
// Before:
typescript: {
  project: '**/*/tsconfig.json';
}
// After:
typescript: {
  tsconfig: {
    configFile: 'tsconfig.eslint.json';
  }
}
```

A single `configFile` takes the resolver's cached code path (populating `configFileMapping`) and auto-walks `references`. The other resolver block (`typescript: true`) stays unchanged.

### Decision: Fixtures excluded from references

Fixtures are in eslint's `ignores`, so the resolver never resolves imports from them. Including them would re-introduce avoidable loads.

## File Changes

- `tsconfig.eslint.json` (new) at the repo root.
- `eslint.config.js` (modified) to swap the resolver `typescript` option from `project` glob to `tsconfig.configFile`.

## Risks / Trade-offs

- The reference list is manual, so it must be kept in sync by hand: adding or removing a source package now requires also updating `tsconfig.eslint.json`, whereas the old glob picked up new packages automatically. A forgotten update doesn't break the build; it just means the resolver silently loses awareness of that package.
- Rollback is to delete the file and revert the resolver block. No other files are touched.

## Open Questions

- Whether knip flags `tsconfig.eslint.json` as unused needs verifying during implementation, adding it to knip ignore if so.
- Whether any editor integrations glob `tsconfig*.json` for typechecking is worth a quick check. The `files: []` + `references` shape is a no-op solution file for the TS server.
