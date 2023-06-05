# Libraries

If you need to build a UMD library instead of a web site, you can provide a `libraryEntry` and `libraryName` option instead:

> If you are creating a package to share between multiple sku apps, then you probably want [compile packages](./docs/extra-features#compile-packages) instead. Libraries should only be used when you have very little control over the target environment (e.g. legacy applications, externally hosted solutions like Auth0).

```ts
export default {
  libraryEntry: 'src/library.js',
  renderEntry: 'src/render.js',
  libraryName: 'MyAwesomeLibrary',
} satisfies SkuConfig;
```

By default the file name of the library will be based on the `libraryName` option. A distinct library file name may be specified by providing a `libraryFile` option:

```ts
export default {
  libraryName: 'MyAwesomeLibrary',
  libraryFile: 'my-awesome-library',
} satisfies SkuConfig;
```

Note that `libraryFile` should _not_ include a `.js` extension as this will be added to the library file name automatically.

Your `library` entry must export its public API via a default export:

```js
export default () => {
  console.log('Hello from my library!');
};
```

Note that, in this scenario, the `render` entry is only used to provide a development environment. No HTML will be generated when running `sku build`.
