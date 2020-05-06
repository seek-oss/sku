---
'sku': minor
---

Remove usage of [`assert`](https://nodejs.org/api/assert.html) in production

If you use [Node's `assert` library](https://nodejs.org/api/assert.html) or its [browser port](https://www.npmjs.com/package/assert), your assertions will now be automatically removed in production via [`babel-plugin-unassert`](https://github.com/unassert-js/babel-plugin-unassert). This allows you to perform more expensive checks during development without worrying about the perfomance impacts on users.

For example, let's assume you wrote the following code:

```js
import React from 'react';
import assert from 'assert';

export const Rating = ({ rating }) => {
  assert(rating >= 0 && rating <= 5, 'Rating must be between 0 and 5');

  return <div>...</div>;
};
```

In production, the code above would be logically equivalent to this:

```js
import React from 'react';

export const Rating = ({ rating }) => <div>...</div>;
```
