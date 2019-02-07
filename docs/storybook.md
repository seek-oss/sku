# [Storybook](https://storybook.js.org/)

Running `sku storybook` will open up a local component explorer, displaying all component instances declared in files named `*.stories.js` (or `.ts`, or `.tsx`), for example:

```js
import { storiesOf } from 'sku/storybook';
import React from 'react';
import Button from './Button';

storiesOf('Button', module)
  .add('Primary', () => <Button variant="primary">Primary</Button>)
  .add('Secondary', () => <Button variant="secondary">Secondary</Button>);
```

_**NOTE:** To access the Storybook API, you should import from `sku/storybook`, since your project isn't depending on Storybook directly._

By default, Storybook runs on port `8081`. If you'd like to use a different port, you can provide it via the `storybookPort` option in `sku.config.js`:

```js
module.exports = {
  storybookPort: 9000
};
```
