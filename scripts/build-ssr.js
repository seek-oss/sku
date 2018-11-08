// First, ensure the build is running in production mode
process.env.NODE_ENV = 'production';

const Promise = require('bluebird');
const webpackPromise = Promise.promisify(require('webpack'));
const fs = require('fs-extra');

const webpackConfig = require('../config/webpack/webpack.config.ssr');
const { paths } = require('../config/projectConfig');

const runWebpack = config => {
  return webpackPromise(config).then(stats => {
    console.log(
      stats.toString({
        chunks: false, // Makes the build much quieter
        children: false,
        colors: true
      })
    );

    if (stats.hasErrors()) {
      throw new Error();
    }
  });
};

const copyPublicFiles = () => {
  if (fs.existsSync(paths.public)) {
    fs.copySync(paths.public, paths.target, {
      dereference: true
    });
    console.log(`Copying ${paths.public} to ${paths.target}`);
  }
};

Promise.each(webpackConfig, runWebpack)
  .then(copyPublicFiles)
  .then(() => console.log('Sku build complete!'))
  .catch(() => process.exit(1));
