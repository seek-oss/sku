# Linting and Formatting

(via [ESLint](http://eslint.org/) and [Prettier](https://github.com/prettier/prettier))

Running `sku lint` will execute the ESLint rules over the code in your `src` directory. You can see the ESLint rules defined for sku projects in [eslint-config-seek](https://github.com/seek-oss/eslint-config-seek). Support is provided for both JavaScript and TypeScript files.

Running `sku format` will format all JavaScript and TypeScript files in your project using [Prettier](https://github.com/prettier/prettier), and fix [ESLint](http://eslint.org/) errors where possible. As changes to formatting are considered non-breaking, please ensure you run `sku format` after upgrading `sku`.

Files can be excluded from formatting by adding paths into the `.prettierignore` file.
