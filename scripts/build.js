// First, ensure the build is running in production mode
process.env.NODE_ENV = 'production';

const webpack = require('webpack');
const webpackConfig = require('../config/webpack/webpack.config');
const fs = require('fs-extra');
const builds = require('../config/builds');

webpack(webpackConfig, (err, stats) => {
  if (err) {
    return console.log(err);
  }

  console.log(
    stats.toString({
      chunks: false, // Makes the build much quieter
      colors: true
    })
  );

  builds.forEach(({ paths }) => {
    if (fs.existsSync(paths.public)) {
      fs.copySync(paths.public, paths.dist, {
        dereference: true
      });
    }
  });
});
