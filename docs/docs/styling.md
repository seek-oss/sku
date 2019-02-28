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

## Static CSS-in-JS

(via [css-in-js-loader](https://github.com/nthtran/css-in-js-loader))

You can import `.css.js` files into your components and use them exactly as you would a regular style sheet. This is mostly useful when you want to take advantage of JavaScript to compose styles:

```js
import { standardWrapper } from 'theme/wrappers';
import { fontFamily } from 'theme/typography';
import { brandPrimary } from 'theme/palette';

export default {
  '.exampleWrapper': {
    ...standardWrapper,
    fontFamily: fontFamily,
    color: brandPrimary,
  },
};
```

```js
import styles from './example.css.js';

export default () => <div className={styles.exampleWrapper}>Hello World!</div>;
```
