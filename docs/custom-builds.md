# Custom builds

If your project has a custom [webpack](https://webpack.js.org) build, you can use the `SkuWebpackPlugin` in your webpack config as part of your plugins array:

```js
const SkuWebpackPlugin = require('sku/webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  plugins: [
    new SkuWebpackPlugin({
      target: 'browser', // or 'node' for SSR builds
      mode:
        process.env.NODE_ENV === 'production' ? 'production' : 'development',
      MiniCssExtractPlugin,
    }),
  ],
};
```

If you want to consume sku packages, you can pass an array of [`compilePackages`](./configuration?id=compilepackages). For example, if you wanted to import a sku package called `my-sku-package`:

```js
module.exports = {
  plugins: [
    new SkuWebpackPlugin({
      compilePackages: ['my-sku-package'],
      ...etc,
    }),
  ],
};
```
