// First, ensure the build is running in production mode
process.env.NODE_ENV = 'production';

const webpack = require('webpack');
const webpackConfig = require('../config/webpack/webpack.config');
const fs = require('fs-extra');
const path = require('path');
const cwd = process.cwd();
const publicPath = path.join(cwd, 'public');
const distPath = path.join(cwd, 'dist');

webpack(webpackConfig, (err, stats) => {
  if (err) {
    return console.log(err);
  }

  console.log(stats.toString({
    chunks: false, // Makes the build much quieter
    colors: true
  }));

  if (!fs.existsSync(publicPath)) {
    return;
  }

  fs.copySync(publicPath, distPath, {
    dereference: true
  });
});
