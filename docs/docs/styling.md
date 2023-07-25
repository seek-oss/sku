# Styling

## Vanilla Extract

The `@vanilla-extract/css` package is not available out of the box so it needs to be installed.

```sh
$ yarn add @vanilla-extract/css
```

Now you can create `.css.ts` files in your project.

```ts
// BigBox.css.ts
import { style } from '@vanilla-extract/css';

export const bigBox = style({
  width: 500,
  height: 500,
});
```

```tsx
// BigBox.tsx
import * as styles from './BigBox.css';

export function BigBox() {
  return <div className={styles.bigBox}>I am a big box</div>;
}
```

See [Vanilla Extract](https://vanilla-extract.style/documentation/getting-started) for full documentation.

## Locally Scoped CSS

(via [CSS Modules](https://github.com/css-modules/css-modules) and [LESS](http://lesscss.org/))

> Support for LESS has been deprecated.
> [Vanilla Extract](#vanilla-extract) is the preferred styling solution supported by sku, and support for LESS will be removed in a future release.
> Consumers are encouraged to migrate to Vanilla Extract at the earliest opportunity.

Import any `.less` file into your Javascript as a `styles` object and use its properties as class names.

For example, given the following LESS file:

```less
.exampleWrapper {
  font-family: comic sans ms;
  color: blue;
}
```

You can then import the classes into your code like so:

```tsx
import styles from './example.less';

export default () => <div className={styles.exampleWrapper}>Hello World!</div>;
```

## treat

As of sku v12, [treat] support has been removed in favour of [Vanilla Extract].

[treat]: https://seek-oss.github.io/treat/
[vanilla extract]: #vanilla-extract

## External CSS

CSS from third-party dependencies can be loaded using a side-effect import, e.g.

```tsx
import { SomeComponent } from 'some-package';

import 'some-package/dist/styles.css';

export const MyComponent = () => {
  return <SomeComponent>{/* ... */}</SomeComponent>;
};
```

_**NOTE:** This should only be used when importing CSS dependencies from a third-party package in `node_modules`. If you are writing custom CSS, please see the [Vanilla Extract](#vanilla-extract) section above._
