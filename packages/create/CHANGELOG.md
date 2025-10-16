# @sku-lib/create

## 1.0.1

### Patch Changes

- Updated dependencies [[`67d4fe8`](https://github.com/seek-oss/sku/commit/67d4fe8a8b1b289c08acd31bfa16cc587017eecb)]:
  - @sku-lib/utils@1.1.0

## 1.0.0

### Major Changes

- Drop support for Node.js versions below 22.19.0 ([#1419](https://github.com/seek-oss/sku/pull/1419))

  BREAKING CHANGE:

  The minimum supported Node.js version is now 22.19.0. Consumers must upgrade to Node.js v22.19.0 or later.

- First major release marking stable support for this package ([#1418](https://github.com/seek-oss/sku/pull/1418))

- Throw error when given unsupported arguments. ([#1418](https://github.com/seek-oss/sku/pull/1418))
  This is now the default behaviour of the updated commander.js version.

  **BREAKING CHANGE**:

  Excess command-arguments will now cause an error.
  To fix this, remove any unsupported arguments provided to the command.

### Minor Changes

- Vite template will be created without experimental flags ([#1424](https://github.com/seek-oss/sku/pull/1424))

### Patch Changes

- Updated webpack description to remove `sku init` reference ([#1421](https://github.com/seek-oss/sku/pull/1421))

- Updated dependencies [[`7ad51f4`](https://github.com/seek-oss/sku/commit/7ad51f42e3c55e1588e908c79f7f83c950acb4c1)]:
  - @sku-lib/utils@1.0.0

## 0.1.0

### Minor Changes

- Release new standalone `sku` template creation CLI ([#1383](https://github.com/seek-oss/sku/pull/1383))

  Introduces a new `@sku-lib/create` package that provides a standalone CLI for scaffolding new sku projects. This package replaces the functionality of `sku init` with a dedicated tool optimized for project creation. The existing `sku init` command is now deprecated and will be removed in a future release.

  **Features:**
  - 🚀 **Simple project creation**: `npx @sku-lib/create my-app` or `pnpm dlx @sku-lib/create my-app`
  - 🔧 **Template support**: Choose between webpack (default) and vite bundlers
  - 📦 **Smart package manager detection**: Automatically detects npm, yarn or pnpm
  - ✨ **Pre-formatted output**: Generated projects are lint-clean and formatted
  - 🛡️ **Input validation**: Secure project creation with npm naming validation

  **Usage:**

  ```bash
  # Create new project with template selection
  npx @sku-lib/create my-app
  pnpm dlx @sku-lib/create my-app

  # Create with specific template
  npx @sku-lib/create my-app --template vite
  pnpm dlx @sku-lib/create my-app --template vite

  # Initialize in current directory
  npx @sku-lib/create .
  pnpm dlx @sku-lib/create .
  ```
