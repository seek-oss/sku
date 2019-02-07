# Code Splitting

At any point in your application, you can use a dynamic import to create a split point.

For example, when importing the default export from another file:

```js
import('./some/other/file').then(({ default: stuff }) => {
  console.log(stuff);
});
```

For dynamically loaded bundles to work in production, **you must provide a `publicPath` option in your sku config.**

For example, if your assets are hosted on a CDN:

```js
module.exports = {
  ...,
  publicPath: `https://cdn.example.com/my-app/${process.env.BUILD_ID}/`
};
```
