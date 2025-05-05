[![npm](https://img.shields.io/npm/v/sku-codemod.svg?style=flat-square)](https://www.npmjs.com/package/sku-codemod)

# Codemods for `sku`

## Usage

```sh
pnpm dlx sku-codemod <codemod> [files] [options]
```

If you don't specify the `codemod` the CLI will prompt you with a list of available codemods.

If you don't specify any `files` the CLI will prompt you to select files to run the codemod on. It defaults to `'.'`.

## Available codemods

| Codemod                   | Description                                                                |
| ------------------------- | -------------------------------------------------------------------------- |
| `transform-vite-loadable` | Converts `sku/@loadable/component` imports to `sku/vite/loadable` imports. |

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
