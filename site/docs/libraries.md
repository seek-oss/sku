# Libraries

If you need to build a UMD library instead of a web site, provide a `libraryEntry` and `libraryName` option instead:

> [!TIP]
> If you are creating a package to share between multiple sku apps, use [compile packages](./extra-features#compile-packages) instead.
> Use a library only when you have little control over the target environment (for example legacy applications, or an externally hosted solution such as Auth0).

```ts
export default {
  libraryEntry: 'src/library.js',
  renderEntry: 'src/render.js',
  libraryName: 'MyAwesomeLibrary',
} satisfies SkuConfig;
```

By default the file name of the library is based on the `libraryName` option.
Provide a `libraryFile` option to set a different library file name:

```ts
export default {
  libraryName: 'MyAwesomeLibrary',
  libraryFile: 'my-awesome-library',
} satisfies SkuConfig;
```

> [!NOTE]
> `libraryFile` should _not_ include a `.js` extension. sku adds that extension to the library file name automatically.

Your `library` entry must export its public API via a default export:

```js
export default () => {
  console.log('Hello from my library!');
};
```

> [!NOTE]
> In this scenario, the `render` entry only provides a development environment. `sku build` does not generate HTML.
