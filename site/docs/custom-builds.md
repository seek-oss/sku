# Custom builds

If your project has a custom [webpack](https://webpack.js.org) build, add `SkuWebpackPlugin` to the plugins array in your webpack config:

```js
import { SkuWebpackPlugin } from 'sku/webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

export default {
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

If you want to consume sku packages, pass an array of [`compilePackages`](./configuration#compilepackages). For example, to import a sku package called `my-sku-package`:

```js
export default {
  plugins: [
    new SkuWebpackPlugin({
      compilePackages: ['my-sku-package'],
      ...etc,
    }),
  ],
};
```
