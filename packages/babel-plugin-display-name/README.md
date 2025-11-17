# @sku-lib/babel-plugin-display-name

Forked from https://github.com/mui/mui-public/tree/master/packages/babel-plugin-display-name.

## Why fork?

For one reason: the mui version adds a `process.env.NODE_ENV` check around the addition of the `displayName` property to React components.
This means that in production builds, the `displayName` property is not added.
However, our specific use case requires the `displayName` to be present even in production builds.
Our fork removes this check, ensuring that `displayName` is always added to React components regardless of the environment.
