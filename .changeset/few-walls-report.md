---
'sku': major
---

Remove `sku playroom` and `sku build-playroom`

BREAKING CHANGE

All playroom scripts have been removed in favour of consumers installing [playroom](https://github.com/seek-oss/playroom) directly. If you'd like to continue using playroom then you can use the [SkuWebpackPlugin](https://seek-oss.github.io/sku/#/./docs/legacy-builds). 


Example config:

```js
// playroom.config.js
const SkuWebpackPlugin = require('sku/webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  components: './src/components',
  outputPath: './dist/playroom',

  webpackConfig: () => ({
    plugins: [
        new MiniCssExtractPlugin(),
        new SkuWebpackPlugin({
            include: paths.src,
            target: 'browser',
            browserslist: ['last 2 chrome versions'],
            mode: 'development',
            displayNamesProd: true,
            removeAssertionsInProduction: false,
            MiniCssExtractPlugin,
        }),
    ]
  })
};
```