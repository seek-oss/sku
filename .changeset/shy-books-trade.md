---
'sku': major
---

`sku init`: Install dependencies with the package manager that was used to run the command

**BREAKING CHANGE**:

The `sku init` command will now install dependencies with the package manager that was used to run the command. This can be overridden via the `--packageManager` flag:

```sh
npx sku init my-app # Will install dependencies using npm
pnpm dlx sku init my-app # Will install dependencies using pnpm
npx sku init --packageManager yarn my-app # Will install dependencies using yarn
```
