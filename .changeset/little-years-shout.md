---
'sku': major
---

Switch to the `automatic` JSX React runtime

This changes how JSX is transformed into valid JavaScript and comes with some performance benefits. It also means that JSX can be used without needing to import React. [Read more about the change here](https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html).

e.g.
```diff
-import React from 'react';

export const MyComponent => <div>MyComponent</div>;
```

**MIGRATION GUIDE**

Ensure your app is running React 17. React 16.14 is also supported if required. Now your app should be working but you may be seeing lint errors similar to the following:

```
'React' is declared but its value is never read
```

To remove all the redundant react imports use the following codemod: 

```bash
npx react-codemod update-react-imports
```


**BREAKING CHANGE**

The minimum supported version of React is now `v16.14.0`.
