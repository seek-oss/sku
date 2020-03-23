# Libraries

If you need to build a UMD library instead of a web site, you can provide a `libraryEntry` and `libraryName` option instead:

> If you are creating a package to share between multiple sku apps, then you probably want [compile packages](./docs/extra-features#compile-packages) instead. Libraries should only be used when you have very little control over the target environment (e.g. legacy applications, externally hosted solutions like Auth0).

```js
modules.exports = {
  libraryEntry: 'src/library.js',
  renderEntry: 'src/render.js',
  libraryName: 'MyAwesomeLibrary',
};
```

Your `library` entry must export its public API via a default export:

```js
export default () => {
  console.log('Hello from my library!');
};
```

Note that, in this scenario, the `render` entry is only used to provide a development environment. No HTML will be generated when running `sku build`.
