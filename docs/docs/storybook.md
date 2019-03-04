# [Storybook](https://storybook.js.org/)

Running `sku storybook` will open up a local component explorer, displaying all component instances declared in files named `*.stories.js` (or `.ts`, or `.tsx`), for example:

```js
import React from 'react';
import Button from './Button';

import { storiesOf } from 'sku/@storybook/react';
import { text } from 'sku/@storybook/addon-knobs';

storiesOf('Button', module)
  .add('Primary', () => (
    <Button variant="primary">{text('Children', 'Primary')}</Button>
  ))
  .add('Secondary', () => (
    <Button variant="secondary">{text('Children', 'Secondary')}</Button>
  ));
```

_**NOTE:** To access the Storybook API, you should import from `sku/@storybook/...`, since your project isn't depending on Storybook packages directly._

The following Storybook packages are included with sku:

- [@storybook/react](https://www.npmjs.com/package/@storybook/react)
- [@storybook/addon-knobs](https://www.npmjs.com/package/@storybook/addon-knobs)

By default, Storybook runs on port `8081`. If you'd like to use a different port, you can provide it via the `storybookPort` option in `sku.config.js`:

```js
module.exports = {
  storybookPort: 9000,
};
```

To build the Storybook, first add the following npm script:

```js
{
  "scripts": {
    "build-storybook": "sku build-storybook"
  }
}
```

Then run `npm run build-storybook`.

By default, Storybook assets are generated in the `dist-storybook` directory in your project root folder. If you would like to specify a custom target directory, you can provide it via the `storybookTarget` option in `sku.config.js`:

```js
module.exports = {
  storybookTarget: './dist/storybook',
};
```
