const webpack = require('webpack');
const webpackConfig = require('../config/webpack/webpack.config');

webpack(webpackConfig, (err, stats) => {
  if (err) {
    console.log(err);
  } else {
    console.log('Build complete!');
  }
});
