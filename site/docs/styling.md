# Styling

## Vanilla Extract

The `@vanilla-extract/css` package is not included by default.
Install it.

```sh
$ pnpm install @vanilla-extract/css
```

You can then create `.css.ts` files in your project.

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

As of sku v13, sku removed [LESS] support in favour of [Vanilla Extract].

[LESS]: http://lesscss.org/
[vanilla extract]: #vanilla-extract

## treat

As of sku v12, sku removed [treat] support in favour of [Vanilla Extract].

[treat]: https://seek-oss.github.io/treat/
[vanilla extract]: #vanilla-extract

## External CSS

You can load CSS from third-party dependencies with a side-effect import.

For example:

```tsx
import { SomeComponent } from 'some-package';

import 'some-package/dist/styles.css';

export const MyComponent = () => {
  return <SomeComponent>{/* ... */}</SomeComponent>;
};
```

> [!NOTE]
> Use this only when you import CSS from a third-party package in `node_modules`.
> If you write custom CSS, see the [Vanilla Extract](#vanilla-extract) section.
