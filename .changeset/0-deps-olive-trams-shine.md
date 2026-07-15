---
'sku': major
---

`deps`: TypeScript updated to version 6

sku now generates a TypeScript 6 compatible `tsconfig.json` for you, so most projects will not need changes. However, TypeScript 6 ships new defaults and deprecations that may affect your source code, dependencies, or any custom config. See the [TypeScript 6.0 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/) or the [5.x to 6.0 migration guide](https://gist.github.com/privatenumber/3d2e80da28f84ee30b77d53e1693378f) for full details.

Run `sku configure` to regenerate your `tsconfig.json`, then `sku lint` to surface anything below.

#### Most likely to need attention

- **Missing `@types` packages.** TypeScript no longer auto-loads every `@types/*` package. In sku, only `node` and `jest` (when using the Jest test runner) are included by default. If you see `Cannot find name`/`Cannot find type definition` errors for globals, add them via [`dangerouslySetTSConfig`](https://seek-oss.github.io/sku/#/./docs/configuration?id=dangerouslysettsconfig):

  ```typescript
  dangerouslySetTSConfig: (config) => ({
    ...config,
    compilerOptions: {
      ...config.compilerOptions,
      types: [...config.compilerOptions.types, 'cypress'],
    },
  }),
  ```

#### If you customize your tsconfig

- **Remove `baseUrl`** — deprecated in TS 6, will be removed in TS 7. If you set `baseUrl` via `dangerouslySetTSConfig`, remove it. For import aliases, use the [`pathAliases`](https://seek-oss.github.io/sku/#/./docs/configuration?id=pathaliases) config option instead.
- **Remove deprecated options** if you set any of these in `dangerouslySetTSConfig`: `downlevelIteration`, `outFile`, `alwaysStrict: false`, `esModuleInterop: false`, `allowSyntheticDefaultImports: false`, `moduleResolution: node`/`node10`/`classic`, `module: amd`/`umd`/`system`/`none`, `target: es3`/`es5`.

#### Source code updates (less common)

- **Import attributes:** replace `import x from './data.json' assert { type: 'json' }` with `with { type: 'json' }`.
- **Namespaces:** replace `module Foo { }` with `namespace Foo { }`.
- **CJS default imports:** replace `import * as x from 'cjs-pkg'` with `import x from 'cjs-pkg'` (interop is always on now).
- **Inference edge cases:** TS 6's improved method inference can change a few inferred types — add explicit annotations where needed.

#### Tooling & dependencies
- **Dependencies with legacy `.d.ts` syntax:** Old `module Foo { }` namespaces may need upgrading, forking, or patching.
- **Temporal polyfills:** If you used `@js-temporal/polyfill` or `temporal-polyfill`, they are now no longer type-compatible with the new built-in `Temporal` lib types.

> Tip: if deprecation errors come from options you set via `dangerouslySetTSConfig`, you can add `ignoreDeprecations: '6.0'` there to silence them temporarily. This will stop working in TypeScript 7.
