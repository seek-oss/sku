# Linting and Formatting

(via [ESLint](http://eslint.org/) and [Prettier](https://github.com/prettier/prettier))

`sku lint` runs the ESLint rules over the code in your `src` directory.
The ESLint rules for sku projects are in [eslint-config-seek](https://github.com/seek-oss/eslint-config-seek). sku supports JavaScript and TypeScript files.

Add paths to the [`eslintIgnore`] sku config option to exclude files from linting.
By default, `sku` ignores these files and directories:

```js
[
  '**/*.vocab/index.ts', // If `languages` is configured in your sku config
  '**/.eslintcache',
  '**/eslint.config.mjs',
  '**/.prettierrc',
  '**/coverage/',
  '**/dist/', // Or your custom configured `target`
  '**/report/',
  '**/tsconfig.json',
  '**/pnpm-lock.yaml',
];
```

`sku format` formats all JavaScript and TypeScript files in your project with [Prettier](https://github.com/prettier/prettier).
It also fixes [ESLint](http://eslint.org/) errors where possible.
Formatting changes are not breaking.
Run `sku format` after you upgrade `sku`.

Add paths to the `.prettierignore` file to exclude files from formatting.

## Path alias imports

When you configure the [`pathAliases`] sku option, sku mirrors the aliases to your `package.json#imports` field so Node resolves them natively.

`sku lint` fails when `package.json#imports` is out of sync with `pathAliases`, reporting the drift without modifying the file.
`sku format` fixes the drift by rewriting `package.json#imports` to match `pathAliases`, removing the field when no aliases are configured.

Commands that resolve `#` imports at runtime will fail when out of sync with `pathAliases` and direct you to run `sku format`.

## Dependency issues

`sku lint` warns when `react`, `react-dom`, `braid-design-system`, `@vanilla-extract/css` or one of your [`compilePackages`] is installed at more than one version.
It also warns when `react-dom` loads a different version of `react`, and when a peer dependency between these packages resolves outside its range.
Each warning shows how each copy got into your dependencies, and the command to investigate it, such as `pnpm why -r`.

These warnings never make `sku lint` fail, and they only appear when you run `sku lint` without file paths.

To turn them off, set `skuSkipValidatePeerDeps` in your `package.json`:

```json
{
  "skuSkipValidatePeerDeps": true
}
```

[`eslintIgnore`]: ./configuration#eslintignore
[`pathAliases`]: ./configuration#pathaliases
[`compilePackages`]: ./configuration#compilepackages
