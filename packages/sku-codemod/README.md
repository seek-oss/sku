[![npm](https://img.shields.io/npm/v/sku-codemod.svg?style=flat-square)](https://www.npmjs.com/package/sku-codemod)

# Codemods for `sku`

## Usage

```sh
pnpm dlx sku-codemod <codemod> [files] [options]
```

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
