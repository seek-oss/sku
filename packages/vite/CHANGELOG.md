# @sku-lib/vite

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
