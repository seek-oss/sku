---
'@sku-lib/create': major
---

Add new standalone create-sku CLI package

Introduces a new `@sku-lib/create` package that provides a standalone CLI for scaffolding new sku projects. This package replaces the functionality of `sku init` with a dedicated tool optimized for project creation. The existing `sku init` command is expected to be deprecated in a future release.

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

**Technical Implementation:**
- Built with TypeScript ES modules
- Uses shared utilities from `@sku-lib/utils`
- Eta templating engine for flexible file generation
- Delegates formatting to `sku format` for consistency
- Comprehensive test coverage with unit and integration tests

**Generated Projects Include:**
- `sku.config.ts` - Bundler configuration
- `package.json`
- TypeScript setup with proper configs
- ESLint and Prettier configuration
- `.gitignore` and `README.md` files
- Starter React app
- `braid-design-system` and `vanilla-extract` pre-installed
