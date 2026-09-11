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

[`eslintIgnore`]: ./configuration#eslintignore
