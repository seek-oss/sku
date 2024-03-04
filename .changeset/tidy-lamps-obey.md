---
'sku': patch
---

Stop passing `--quiet` flag to the Storybook CLI when running `sku storybook`

This flag was added to suppress verbose CLI output, but as of [Storybook CLI v7.1.0][release notes] this also hides the dev server info which includes the URL to access the Storybook UI.

The flag has now been removed to provide a better default experience when using the Storybook CLI.
Users can still pass `--quiet` to suppress verbose output if desired:

```sh
pnpm run sku storybook --quiet
```

[release notes]: https://github.com/storybookjs/storybook/releases/tag/v7.1.0-alpha.38
