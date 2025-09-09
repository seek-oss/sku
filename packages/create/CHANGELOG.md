# @sku-lib/create

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
