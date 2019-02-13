# FAQ

## Why isn't X working?

If you're having issues with sku please contact the _#sku-support_ channel for help. However, you can try the following to resolve common issues.

- Remove any direct dependencies that may clash with sku. If you're unsure you can ask in _#sku-support_. The usual suspects are:
  - `jest` and `jest-cli`
  - Any thing `babel` related
  - `webpack` or any `webpack` loaders/plugins that sku already provides
  - `storybook`
  - `typescript`
  - `prettier`, `eslint` and `tslint`
