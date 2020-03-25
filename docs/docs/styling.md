# Styling

## Locally Scoped CSS

(via [CSS Modules](https://github.com/css-modules/css-modules) and [Less](http://lesscss.org/))

Import any `.less` file into your Javascript as a `styles` object and use its properties as class names.

For example, given the following Less file:

```less
.exampleWrapper {
  font-family: comic sans ms;
  color: blue;
}
```

You can then import the classes into your JavaScript code like so:

```js
import styles from './example.less';

export default () => <div className={styles.exampleWrapper}>Hello World!</div>;
```

## [treat](https://seek-oss.github.io/treat/)

Note: You must access all treat imports through the sku prefix. e.g. `sku/treat`, `sku/react-treat`;

See treat's [docs](https://seek-oss.github.io/treat/) for details on proper usage.

```js
import { style } from 'sku/treat';

export const bigBox = style({ width: 500, height: 500 });
```

```js
import { useStyles } from 'sku/react-treat';
import * as styleRefs from './example.treat';

export default () => {
  const styles = useStyles(styleRefs);

  return <div className={styles.bigBox}>I am a big box</div>;
};
```
