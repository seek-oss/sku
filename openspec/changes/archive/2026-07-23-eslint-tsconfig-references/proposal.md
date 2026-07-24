# Proposal: eslint-tsconfig-references

## Intent

`pnpm lint` emits a warning from `eslint-import-resolver-typescript` on every run:

```
Multiple projects found, consider using a single `tsconfig` with `references` to speed up, or use `noWarnOnMultipleProjects` to suppress this warning
```

When the linter runs from scratch, it takes about **136.5s**, most of which goes to import resolution. The `project` glob it uses matches dozens of tsconfigs, including many fixtures eslint never lints, and the resolver re-scans this glob on every import instead of caching it, adding about 78s of avoidable filesystem work.

## Scope

In scope:

- Add a single tsconfig file at the repo root that references the 9 real source-package tsconfigs, for the eslint import resolver to use as its entry point instead of a glob.

Out of scope:

- Any changes to per-package `tsconfig.json`, `tsconfig.build.json`, the root `tsconfig.json`, `lint:tsc`, or build config. The fix is scoped to eslint resolver config only.
- A full project-references migration (`composite: true`, `tsc --build`), which is a separate, larger change.

## Impact

- The affected code is `eslint.config.js` (resolver settings) and a new tsconfig file at the repo root.
- There is no build or runtime impact. sku's published behaviour and build outputs are unchanged.
- Running `lint:eslint` from scratch should drop materially. Warm runs (~5.5s) are unaffected.
- For maintenance, the new tsconfig file must be updated when a source package is added or removed. Fixtures are deliberately excluded.
- The risk is low, since there is no `composite: true`, no `tsc --build`, and no per-package tsconfig changes.
