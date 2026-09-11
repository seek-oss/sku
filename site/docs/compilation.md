# Compilation

## Modern Javascript

(via [Babel](https://babeljs.io/))

You can use `import`, `const`, `=>`, rest/spread operators, destructuring, classes with class properties, and [JSX](https://facebook.github.io/react/docs/jsx-in-depth.html) in your code. Babel compiles them with these plugins:

- [@babel/preset-env](https://babeljs.io/docs/en/babel-preset-env/)
- [@babel/preset-react](https://babeljs.io/docs/en/babel-preset-react/)
- [@babel/preset-typescript](https://babeljs.io/docs/en/babel-preset-typescript)
- [@babel/plugin-proposal-object-rest-spread](https://babeljs.io/docs/en/babel-plugin-proposal-object-rest-spread)
- [@babel/plugin-proposal-class-properties](https://babeljs.io/docs/en/babel-plugin-proposal-class-properties)
- [babel-preset-react-optimize](https://github.com/thejameskyle/babel-react-optimize)

If you want to use a package that needs a Babel plugin, try [Babel Macros](https://github.com/kentcdodds/babel-plugin-macros). Macros apply the configuration changes for you when you import the package. For example, to use [Emotion](https://emotion.sh/):

```ts
import styled from 'react-emotion/macro';
import { css } from 'emotion/macro';
```

Many packages support macros. Check the package documentation for help.

## TypeScript

TypeScript files (`.ts` and `.tsx`) are supported as part of your source code. You can also mix JavaScript with TypeScript. This lets you convert the project to TypeScript over time. The `sku lint` script reports type errors in your code.
