---
'sku': minor
---

`vite/loadable`: Add the `resolveComponent` option to the `loadable` function. The `loadable` function returns the `default` export by default. By using the `resolveComponent` function you can specify the correct component for `loadable` to use.

**example usage**

```typescript
// src/MyComponent.tsx
import React from 'react';

export const MyComponent = () => {
  return <div>Hello, world!</div>;
};

// src/App.tsx
import { loadable } from 'sku/vite/loadable';

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
