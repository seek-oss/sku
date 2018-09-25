// First, ensure the build is running in production mode
process.env.NODE_ENV = 'production';

const Promise = require('bluebird');
const webpackPromise = Promise.promisify(require('webpack'));
const webpackConfig = require('../config/webpack/webpack.config');
const fs = require('fs-extra');
const builds = require('../config/builds');

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
      // Webpack has already printed the errors, so we just need to stop execution.
      throw new Error();
    }

    const info = stats.toJson();

    if (stats.hasWarnings()) {
      info.warnings.forEach(console.warn);
    }
  });
};

const copyPublicFiles = () => {
  builds.forEach(({ paths }) => {
    if (fs.existsSync(paths.public)) {
      fs.copySync(paths.public, paths.dist, {
        dereference: true
      });
      console.log(`Copying ${paths.public} to ${paths.dist}`);
    }
  });
};

Promise.each(webpackConfig, runWebpack)
  .then(copyPublicFiles)
  .then(() => console.log('Sku build complete!'))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
