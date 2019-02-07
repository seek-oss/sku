# Libraries

If you need to build a UMD library instead of a web site, you can provide a `libraryEntry` and `libraryName` option instead:

```js
modules.exports = {
  libraryEntry: 'src/library.js',
  renderEntry: 'src/render.js',
  libraryName: 'MyAwesomeLibrary'
};
```

Your `library` entry must export its public API via a default export:

```js
export default () => {
  console.log('Hello from my library!');
};
```

Note that, in this scenario, the `render` entry is only used to provide a development environment. No HTML will be generated when running `sku build`.
