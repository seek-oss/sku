[![npm](https://img.shields.io/npm/v/sku-codemod.svg?style=flat-square)](https://www.npmjs.com/package/sku-codemod)

# Codemods for `sku`

## Usage

```sh
pnpm dlx @sku-lib/codemod <codemod> [path] [options]
```

If you don't specify the `codemod` the CLI will prompt you with a list of available codemods.

If you don't specify a `path` the CLI will prompt you to enter a path to a directory to run the codemod on.
The default path is `'.'`.

## Available codemods

| Codemod                   | Description                                                                     |
| ------------------------- | ------------------------------------------------------------------------------- |
| `transform-vite-loadable` | Converts `sku/@loadable/component` imports to `@sku-lib/vite/loadable` imports. |
| `jest-to-vitest`          | Converts usage of Jest APIs to Vitest APIs.                                     |

## Options

| Option        | Description                                                         |
| ------------- | ------------------------------------------------------------------- |
| `-d, --dry`   | Show which files would be modified without actually modifying them. |
| `-p, --print` | Print out the changes made to each file.                            |
| `-h, --help`  | Show help information.                                              |

## Contributing

Refer to [CONTRIBUTING.md](/CONTRIBUTING.md).

## License

MIT License
