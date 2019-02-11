# Compilation

## Modern Javascript

(via [Babel](https://babeljs.io/))

Use `import`, `const`, `=>`, rest/spread operators, destructuring, classes with class properties, [JSX](https://facebook.github.io/react/docs/jsx-in-depth.html) and all their friends in your code. It'll all just work, thanks to the following Babel plugins:

- [@babel/preset-env](https://babeljs.io/docs/en/babel-preset-env/)
- [@babel/preset-react](https://babeljs.io/docs/en/babel-preset-react/)
- [@babel/preset-typescript](https://babeljs.io/docs/en/babel-preset-typescript)
- [@babel/plugin-proposal-object-rest-spread](https://babeljs.io/docs/en/babel-plugin-proposal-object-rest-spread)
- [@babel/plugin-proposal-class-properties](https://babeljs.io/docs/en/babel-plugin-proposal-class-properties)
- [babel-preset-react-optimize](https://github.com/thejameskyle/babel-react-optimize)

If you'd like use a package that requires adding a Babel plugin, try [Babel Macros](https://github.com/kentcdodds/babel-plugin-macros). Macros allow packages to apply the configuration changes for you when they are imported. For example, to use [Emotion](https://emotion.sh/):

```js
import styled from 'react-emotion/macro';
import { css } from 'emotion/macro';
```

Lots of packages support macros, and their documentation is best place to look for help.

## TypeScript

TypeScript files (`.ts` and `.tsx`) are supported as part of your source code. You can also mix JavaScript with TypeScript allowing you to slowly convert your project to TypeScript over time. The `sku lint` script will report any type errors in your code.
