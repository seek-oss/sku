# @sku-lib/vite

## 1.0.1

### Patch Changes

- Migrate package bundling to use tsdown ([#1464](https://github.com/seek-oss/sku/pull/1464))

## 1.0.0

### Major Changes

- Drop support for Node.js versions below 22.19.0 ([#1419](https://github.com/seek-oss/sku/pull/1419))

  BREAKING CHANGE:

  The minimum supported Node.js version is now 22.19.0. Consumers must upgrade to Node.js v22.19.0 or later.

## 0.1.2

### Patch Changes

- Experimental vite bundler now requires vite v7. ([#1346](https://github.com/seek-oss/sku/pull/1346))

  This is a breaking peer dependency change for projects that use the experimental vite bundler. Since this is an experimental feature, we are not bumping the major version.

- Bump peer dependencies to support React 19 ([#1307](https://github.com/seek-oss/sku/pull/1307))

## 0.1.1

### Patch Changes

- `loadable`: The factory type now sets `default` as optional. Not all components loaded will have a `default` export. ([#1291](https://github.com/seek-oss/sku/pull/1291))

## 0.1.0

### Minor Changes

- Initial release. ([#1265](https://github.com/seek-oss/sku/pull/1265))

  This has been split from the core sku code. New changes:
  - Adds a `resolveComponent` option to the `loadable` function. The `loadable` function returns the `default` export by default. By using the `resolveComponent` function you can specify the correct component for `loadable` to use.

  **EXAMPLE USAGE:**

  ```typescript
  // src/MyComponent.tsx
  export const MyComponent = () => {
    return <div>Hello, world!</div>;
  };

  // src/App.tsx
  import { loadable } from '@sku-lib/vite/loadable';

  const MyComponent = loadable(() => import('./MyComponent'), {
    resolveComponent: (module) => module.MyComponent,
  });

  export const App = () => {
    return (
      <div>
        <MyComponent />
      </div>
    );
  };
  ```
