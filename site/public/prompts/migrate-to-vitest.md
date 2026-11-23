# Migrate a sku app from Jest to Vitest

Migrate this sku app from **Jest to Vitest**, and to **ESM** if it isn't already.
These instructions are based on the sku Vitest migration guide (https://seek-oss.github.io/sku/vitest).
If the installed sku version looks newer than these instructions, check the docs or changelog for changes.

Never push branches, open PRs, or otherwise touch the remote without the user's explicit permission.

## 1. Assess

Run from the app root (for monorepos, confirm which package is the sku app).

Detect:

- Package manager (lockfile) and the sku version (must be >= 15). If older, stop and ask whether to upgrade first.
- `testRunner` in the sku config: unset or `jest` means the Vitest migration is needed; `vitest` means it's done.
- `"type": "module"` in `package.json` (ESM done or not).
- Working tree state (`git status`). If there are uncommitted changes, stop and ask the user what to do with them before branching or changing any files. Later steps revert individual files with `git checkout`, which would discard uncommitted work.

Report the findings and the plan, then ask the user about anything unresolved, for example:

- Convert leftover CJS files to ESM, or rename them to `.cjs`/`.cts`?
- Branch name / base branch (default: the repo's trunk, e.g. `main` or `master`)?
- Install `@vitest/coverage-v8` (only if they collect coverage)?

## 2. Branch and commits

Unless the user asks otherwise:

- Work on a single new branch off the base branch.
- Commit each logical step separately (dependency install, codemod, manual fixes, snapshot updates, ESM conversion, Jest cleanup).
- Commit message bodies are combined later to make the PR description, so write them in this format:
  - Subject line: a short summary of the step.
  - Body: one `- ` dot point per notable change, each on a single line (no wrapping, no nested dot points). Notable means something a reviewer wouldn't assume: workarounds, added config, fixes, removed deps. Leave out routine codemod output and anything that wasn't needed or didn't apply. If a step has nothing notable, leave the body empty.
- Build the PR description from the commit bodies: keep only the dot-point lines (oldest commit first), then add a blank line and `This migration was undertaken by following this migration guide: https://seek-oss.github.io/sku/vitest`. That line goes in the PR description only, not in any commit. Don't use `gh pr create --fill` or `--fill-verbose`: they use the branch name as the title, nest each body under its commit subject, and include trailers such as `Co-authored-by`.

  ```sh
  body=$(mktemp)
  {
    git log --reverse --format=%b <base>..HEAD | grep '^- '
    echo
    echo 'This migration was undertaken by following this migration guide: https://seek-oss.github.io/sku/vitest'
  } > "$body"
  # Only with the user's permission:
  gh pr create --draft --base <base> --title 'Migrate from Jest to Vitest' --body-file "$body"
  ```

## Dependency pinning conventions

Applies to every dep added, removed, or changed (`vitest`, `@vitest/coverage-v8`, etc.).

- Infer the repo's convention before installing: check how existing deps are specified in `package.json` (exact vs `^`/`~`), plus `.npmrc`/`pnpm-workspace.yaml` settings (e.g. `save-exact`, `savePrefix`, catalogs) and Renovate/Dependabot config. Follow it, and the same convention for `dependencies` vs `devDependencies`. Install with the matching flag (e.g. `--save-exact`) rather than editing versions by hand, and keep the lockfile specifiers in sync.
- Match how sku itself is specified (pinned vs ranged) for sku-adjacent deps unless the repo clearly does otherwise.
- Remove any pins/overrides/resolutions that become unnecessary because of the migration, and don't introduce new ones without need.
- Don't stop mid-migration to ask. If the convention is ambiguous (mixed styles, no clear precedent, a dep that doesn't fit the pattern), pick the safest option (exact pin if unsure), note each case, and raise them with the user **after** completing the migration, in the final summary.

## 3. Vitest

1. Read the [Vitest migration notes](https://vitest.dev/guide/migration.html#jest) if unfamiliar with the differences from Jest.
2. Install: `<pm> add -D vitest` (and `@vitest/coverage-v8` if coverage is used).
3. Add `testRunner: 'vitest'` to the existing default export in the sku config. Keep every other option already there; do not replace the file with a new config:

   ```ts
   export default {
     // ...existing options
     testRunner: 'vitest',
   } satisfies SkuConfig;
   ```

4. Run the codemod: `pnpm dlx @sku-lib/codemod jest-to-vitest .` (use the repo's package manager equivalent). Review the diff; more manual changes may be needed.
5. Manual follow-ups:
   - Globals are disabled: tests must `import { describe, expect, it, vi, ... } from 'vitest'` (`jest.*` -> `vi.*`).
   - Setup file: `@testing-library/jest-dom` -> `@testing-library/jest-dom/vitest`.
   - If using Testing Library, add to the setup file:

     ```ts
     import '@testing-library/jest-dom/vitest';
     import { cleanup } from '@testing-library/react';
     import { afterEach } from 'vitest';
     afterEach(cleanup);
     ```

   - Vitest defaults to watch mode: update the `test` script to `sku test --run` (CI doesn't watch, so CI scripts may omit it).
   - Revert codemod changes to non-Vitest tests: it adds `vitest` imports to Cypress specs/support files and mocha tests (e.g. `test/smoke`). Check `git status`, confirm those files have no other changes, then revert only those files (e.g. `git checkout -- <file>`).
   - `.js` specs containing JSX must be renamed `.jsx` (with their `__snapshots__` files); Vitest won't parse JSX in `.js`.
   - Regenerate snapshots with `pnpm sku test --run -u` (use the repo's package manager equivalent): the header, key format (`A: b` -> `A: > b`) and `vanilla-extract` class hashes change. Confirm the diff is only those.
   - `vi.mock` calls are hoisted above the imports, so factories can't use the test file's imports or top-level variables:
     - Replace `require()` in factories with `await vi.importActual<typeof X>('x')` (make the factory `async`), using `import type * as X` for types (ESLint forbids `import()` types).
     - Helpers or mocks referenced by factories must be declared with `vi.hoisted()` (use `vi.hoisted(async () => ...)` if it needs a dynamic import such as `react`; use `createElement` rather than JSX inside it).
     - `vi.requireMock` doesn't exist; import the hoisted mock instead.
   - `vi.advanceTimersByTime`/`runAllTimers` without fake timers throws in Vitest (Jest only warned). Remove such no-op calls or enable fake timers deliberately.
   - The Vitest ESLint plugin makes `vitest/expect-expect` an error (Jest's was a warning). For tests that assert through helpers, configure `assertFunctionNames` (e.g. `['expect', 'expectFoo']`) in `dangerouslySetESLintConfig`.
   - Side-effect imports (e.g. `import '@testing-library/jest-dom'`) between imports block the `import-x/order` autofix. Remove them from specs when the setup file already covers them.
   - Remove Jest deps/config/types (`jest`, `@types/jest`, `jest.config.*`, `dangerouslySetJestConfig`, the `jest` ESLint global, `babel-jest`, unused `fileMock`s, etc.) once nothing references them.
   - Check for `as unknown` casts (and other type casts on mock values, e.g. `as ReturnType<typeof useX>`) in tests, including ones the codemod produced when converting `(fn as jest.Mock)`. Where possible, replace them with a partial mock so the cast is unnecessary: `vi.mocked(useX, { partial: true }).mockReturnValue({ ... })` makes the return value's top-level keys optional; add `deep: true` when nested objects also need to be partial. Run the type check afterwards; keep a cast only where a partial mock genuinely can't express it, and mention those in the final summary.

## 4. ESM

ESM is typically required alongside Vitest because of Jest's ESM limitations. Skip this section if `"type": "module"` is already set.

- Add `"type": "module"` to `package.json`.
- Find CJS: `npx eslint-cjs-to-esm "./src/**/*.{js,ts}" --rule "node/file-extension-in-import: off, file-extension-in-import-ts/file-extension-in-import-ts: off, import/extensions: off"`.
- Convert `require`/`module.exports` to `import`/`export`. Check dev server middleware, polyfills, scripts, and tool configs (eslint, prettier, etc.). Files kept as CJS must be renamed `.cjs`/`.cts`.
- Replace webpack-only HMR code that uses `module.hot`, because `module` doesn't exist in ESM. Use `import.meta.webpackHot` while the app is still on webpack, and `import.meta.hot` after it moves to Vite. Only remove the HMR code if neither applies, and mention that removal in the commit description.
- Tooling that loads its config file via dynamic `import()` works fine with an ESM config (`export default`).
- Under webpack, strict-ESM application `.js` files fail on extensionless imports. Add a rule in `dangerouslySetWebpackConfig`: `module.rules.push({ test: /\.m?js$/, resolve: { fullySpecified: false } })`. It can be removed if the app later moves off webpack. Note it in the commit description.
- Explicit file extensions are only needed in non-application code (Node scripts, configs); sku sets `allowImportingTsExtensions`, so import `.ts` files with a `.ts` extension there.

## 5. Verify

`pnpm sku test --run`, `pnpm sku lint`, and `pnpm sku build` all pass (use the repo's package manager equivalent). Let `sku lint` handle type checking; do not run bare `tsc` unless the repo already does. Also check that `pnpm sku start` still boots and serves pages. Fix any failures before finishing, and tell the user about issues not covered above (sku docs ask for reports via the sku support page: https://seek-oss.github.io/sku/support).

## 6. Finish

- Summarize the changes, anything left unmigrated, and manual follow-ups.
- Raise any ambiguous dependency pinning decisions (see "Dependency pinning conventions"), listing each dep, what you chose, and why, and ask whether to change it. If the answer changes a pin, amend it into the relevant commit.
- Confirm each notable change is a single-line dot point in a commit body (check with `git log --reverse --format='%s%n%b' <base>..HEAD`).
- **Do not push or open a PR** without the user's explicit permission. If the user will open the PR themselves, give them the generated PR description (see "Branch and commits") in a code block so they can paste it.
