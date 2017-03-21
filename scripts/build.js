// First, ensure the build is running in production mode
process.env.NODE_ENV = 'production';

const webpack = require('webpack');
const webpackConfig = require('../config/webpack/webpack.config');
const fs = require('fs-extra');
const paths = require('../config/paths');

webpack(webpackConfig, (err, stats) => {
  if (err) {
    return console.log(err);
  }

  console.log(stats.toString({
    chunks: false, // Makes the build much quieter
    colors: true
  }));

  if (!fs.existsSync(paths.public)) {
    return;
  }

  fs.copySync(paths.public, paths.dist, {
    dereference: true
  });
});
