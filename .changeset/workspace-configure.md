---
'sku': minor
---

`configure`: Add a `sku configure workspace` subcommand that syncs the `pnpm-workspace.yaml` at the workspace root.

Run `sku configure workspace` to apply sku's recommended pnpm workspace configurations to the `pnpm-workspace.yaml` at the workspace root. This will also create the file if it doesn't exist.

Run `sku configure workspace --check` to check the workspace configurations against sku's recommended settings. This command will fail if the file is missing.
