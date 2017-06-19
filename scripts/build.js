// First, ensure the build is running in production mode
process.env.NODE_ENV = 'production';

const Promise = require('bluebird');
const webpackConfig = require('../config/webpack/webpack.config');
const fs = require('fs-extra');
const spawn = require('threads').spawn;

const builds = require('../config/builds');

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

const spawnWebpackForConfigIndex = configIndex => {
  const webpackThread = spawn(input => {
    const path = require('path');
    const configs = require(path.resolve(
      input.__dirname,
      '../config/webpack/webpack.config'
    ));
    const config = configs[input.configIndex];

    const Promise = require('bluebird');
    const webpackPromise = Promise.promisify(require('webpack'));

    return webpackPromise(config).then(stats => {
      console.log(
        stats.toString({
          chunks: false, // Makes the build much quieter
          colors: true
        })
      );
    });
  });

  webpackThread
    .send({
      configIndex,
      __dirname,
      argv: process.argv
    })
    .on('done', () => {
      webpackThread.kill();
    });

  return webpackThread.promise();
};

Promise.each(webpackConfig, (_, configIndex) =>
  spawnWebpackForConfigIndex(configIndex))
  .then(copyPublicFiles)
  .then(() => console.log('Sku build complete!'));
