## 1. Create solution tsconfig

- [ ] 1.1 Create `tsconfig.eslint.json` at repo root with `files: []` and `references` to the root `tsconfig.json` and the 9 source-package tsconfigs (`packages/sku`, `packages/codemod`, `packages/create`, `packages/vite`, `packages/pnpm-plugin`, `packages/babel-plugin-display-name`, `private/utils`, `private/inject-changelog-preamble`, `private/react-lib-with-loadable`)
- [ ] 1.2 Verify no referenced tsconfig has its own `references` field, which would cause a transitive walk beyond the intended 9

## 2. Update eslint resolver config

- [ ] 2.1 In `eslint.config.js`, replace the `typescript: { project: '**/*/tsconfig.json' }` block with `typescript: { tsconfig: { configFile: 'tsconfig.eslint.json' } }`
- [ ] 2.2 Leave the first resolver block (`typescript: true`) unchanged

## 3. Verify correctness

- [ ] 3.1 Run `pnpm lint:eslint` from scratch (delete `.eslintcache` first) and confirm no "Multiple projects found" warning appears
- [ ] 3.2 Confirm no new lint errors are reported compared to baseline (diff the output against the pre-change run)
- [ ] 3.3 Run `pnpm lint:tsc` and `pnpm lint:tsc:sku` and confirm identical behaviour to baseline (no files added or removed, no new errors)
- [ ] 3.4 Run `DEBUG=eslint-import-resolver-typescript pnpm lint:eslint` and confirm no `fixtures/` or `node_modules/` paths appear in `resolved projects` log lines, and that the `resolving projects:` count drops from ~960 to near-zero (cached after the first call)

## 4. Measure performance impact

- [ ] 4.1 Record the from-scratch baseline before changes: `hyperfine --runs 3 --prepare 'rm -f node_modules/.cache/eslint/.eslintcache' "./node_modules/.bin/eslint --cache --cache-location 'node_modules/.cache/eslint/.eslintcache' ."`
- [ ] 4.2 Record the from-scratch time after changes with the same command and compare
- [ ] 4.3 Record a `TIMING=1` per-rule breakdown after changes and confirm `import-x/no-duplicates` drops from the 101s baseline

## 5. Tooling hygiene

- [ ] 5.1 Check whether `knip` flags `tsconfig.eslint.json` as unused, and if so, add it to knip's ignore config
- [ ] 5.2 Add a changeset entry (this is repo-internal tooling, so no published package version bump is required, but follow repo convention)
