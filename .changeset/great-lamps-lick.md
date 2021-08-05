---
'sku': major
---

Upgrade to webpack 5

All start and build scripts, including storybook will now use webpack 5. Along with the webpack upgrade a lot of other related dependencies have been updated. 

MIGRATION GUIDE

While there is no breaking change from a sku perspective, there are many underlying changes that may require attention. 

Things to validate before merging: 

- Remove reliance on [automatic NodeJS polyfills](https://webpack.js.org/blog/2020-10-10-webpack-5-release/#automatic-nodejs-polyfills-removed)
- If you use `dangerouslySetWebpackConfig`, check it's working against webpack 5 
- Static assets are working correctly (e.g. images, fonts, etc)
- Both start and build scripts are outputting a working application

[Webpack 5 migration guide](https://webpack.js.org/migrate/5)
[Webpack 5 release notes](https://webpack.js.org/blog/2020-10-10-webpack-5-release/)
