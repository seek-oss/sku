---
'@sku-lib/vite': minor
---

Initial release.

This has been split from the core sku code. New changes:

* Adds a `resolveComponent` option to the `loadable` function. The `loadable` function returns the `default` export by default. By using the `resolveComponent` function you can specify the correct component for `loadable` to use.


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
