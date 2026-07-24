## 1. Create solution tsconfig

- [x] 1.1 Create `tsconfig.eslint.json` at repo root with `files: []` and `references` to the root `tsconfig.json` and the 9 source-package tsconfigs (`packages/sku`, `packages/codemod`, `packages/create`, `packages/vite`, `packages/pnpm-plugin`, `packages/babel-plugin-display-name`, `private/utils`, `private/inject-changelog-preamble`, `private/react-lib-with-loadable`)
- [x] 1.2 Verify no referenced tsconfig has its own `references` field, which would cause a transitive walk beyond the intended 9

## 2. Update eslint resolver config

- [x] 2.1 In `eslint.config.js`, replace the `typescript: { project: '**/*/tsconfig.json' }` block with `typescript: { tsconfig: { configFile: 'tsconfig.eslint.json' } }`
- [x] 2.2 Leave the first resolver block (`typescript: true`) unchanged

## 3. Verify correctness

- [x] 3.1 Run `pnpm lint:eslint` from scratch (delete `.eslintcache` first) and confirm no "Multiple projects found" warning appears
- [x] 3.2 Confirm no new lint errors are reported compared to baseline (diff the output against the pre-change run)
- [x] 3.3 Run `pnpm lint:tsc` and `pnpm lint:tsc:sku` and confirm identical behaviour to baseline (no files added or removed, no new errors)
- [x] 3.4 Run `DEBUG=eslint-import-resolver-typescript pnpm lint:eslint` and confirm no `fixtures/` or `node_modules/` paths appear in `resolved projects` log lines, and that the `resolving projects:` count drops from ~960 to near-zero (cached after the first call)

## 4. Measure performance impact

- [x] 4.1 Record the from-scratch baseline before changes: `hyperfine --runs 3 --prepare 'rm -f node_modules/.cache/eslint/.eslintcache' "./node_modules/.bin/eslint --cache --cache-location 'node_modules/.cache/eslint/.eslintcache' ."`
- [x] 4.2 Record the from-scratch time after changes with the same command and compare
- [x] 4.3 Record a `TIMING=1` per-rule breakdown after changes and confirm `import-x/no-duplicates` drops from the 101s baseline

## 5. Tooling hygiene

- [x] 5.1 Check whether `knip` flags `tsconfig.eslint.json` as unused, and if so, add it to knip's ignore config
