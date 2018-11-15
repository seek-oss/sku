// First, ensure the build is running in production mode
process.env.NODE_ENV = 'production';

const path = require('path');
const { promisify } = require('util');
const webpackPromise = promisify(require('webpack'));
const fs = require('fs-extra');
const rimraf = promisify(require('rimraf'));

const [
  clientConfig,
  serverConfig
] = require('../config/webpack/webpack.config.ssr');
const { paths } = require('../context');

const runWebpack = async config => {
  const stats = await webpackPromise(config);

  console.log(
    stats.toString({
      chunks: false, // Makes the build much quieter
      children: false,
      colors: true
    })
  );

  if (stats.hasErrors()) {
    throw new Error(stats.toJson().errors);
  }
};

const copyPublicFiles = () => {
  if (fs.existsSync(paths.public)) {
    fs.copySync(paths.public, paths.target, {
      dereference: true
    });
    console.log(`Copying ${paths.public} to ${paths.target}`);
  }
};

const cleanTargetFolder = () => rimraf(`${paths.target}/*`);

(async () => {
  try {
    await cleanTargetFolder();
    await runWebpack(clientConfig);
    console.log('Client webpack done');

    await runWebpack(serverConfig);
    console.log('Server webpack done');

    await copyPublicFiles();

    console.log('Sku build complete!');
  } catch (e) {
    console.log(e);

    process.exit(1);
  }
})();
