# @sku-lib/rolldown-plugin-display-name

A [Rolldown](https://rolldown.rs) and [Vite](https://vite.dev) plugin that adds a `displayName` to React components.
It is a port of `@sku-lib/babel-plugin-display-name` to the [oxc](https://oxc.rs) toolchain.
That plugin is a fork of [`@mui/internal-babel-plugin-display-name`](https://github.com/mui/mui-public/tree/master/packages/babel-plugin-display-name).
Unlike the MUI plugin, this plugin adds the `displayName` in production builds too.

```js
// vite.config.js
import { displayName } from '@sku-lib/rolldown-plugin-display-name';

export default {
  plugins: [displayName()],
};
```

The plugin adds a statement after the declaration:

```js
const Test = () => <img />;
Test.displayName = 'Test';
```

This applies to:

- Function components that are assigned to a variable, a property, or an object path, e.g. `foo.bar = () => <img />` or `const Components = { path: { test: () => <img /> } }`
- Results of `createContext`, `forwardRef` and `memo` from `react`

The plugin does not change function declarations, class components, default exports, and functions inside JSX.

## Options

```js
displayName({
  // Extra callees. The keys are module specifiers, and the values are export names.
  // The plugin always allows `{ react: ['createContext', 'forwardRef', 'memo'] }`.
  allowedCallees: { 'react-fela': ['createComponent'] },

  // Options for Rolldown only.
  include: /\.[cm]?[jt]sx?(?:$|\?)/, // IDs of the modules to transform
  exclude: /[\\/]node_modules[\\/]|\0rolldown\/runtime\.js/, // IDs of the modules to skip (the default skips dependencies and the Rolldown runtime)
  sourcemap: true, // the plugin skips source maps in Vite builds with `build.sourcemap: false`
  rawTransfer: true, // use oxc-parser's experimental raw transfer where supported
});
```

The package also exports the transform function on its own:

```js
import { transform } from '@sku-lib/rolldown-plugin-display-name';

const result = transform(code, 'file.jsx'); // { code, map } | null
```

## Ordering

The plugin must see JSX, so it must run before the plugins that compile it.
The plugin sets `enforce: 'pre'` for this reason.

## Differences from the Babel plugin

- The plugin finds imports from the import declarations of the module.
  It does not track scopes, so a local variable with the name of an import can fool it.
- It supports aliased imports, e.g. `import { memo as m } from 'react'`.
- It does not rename anonymous functions that it passes to a wrapper.
- It does not add a `displayName` to a component that has a name that it cannot express as a member expression, e.g. `{ 'foo-bar': () => <img /> }`.
