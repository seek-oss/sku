// First, ensure the build is running in production mode
process.env.NODE_ENV = 'production';

const webpack = require('webpack');
const webpackConfig = require('../config/webpack/webpack.config');

webpack(webpackConfig, (err, stats) => {
  if (err) {
    console.log(err);
  } else {
    console.log(stats.toString({
      chunks: false, // Makes the build much quieter
      colors: true
    }));
  }
});
