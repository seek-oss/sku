// First, ensure the build is running in production mode
process.env.NODE_ENV = 'production';

const path = require('path');
const fs = require('fs-extra');
const { promisify } = require('util');
const webpackPromise = promisify(require('webpack'));
const rimraf = promisify(require('rimraf'));

const webpackConfigs = require('../config/webpack/webpack.config');
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
      // Webpack has already printed the errors, so we just need to stop execution.
      throw new Error();
    }

    const info = stats.toJson();

    if (stats.hasWarnings()) {
      info.warnings.forEach(console.warn);
    }
  });
};

const cleanDistFolders = () => rimraf(`${paths.target}/*`);

const cleanRenderJs = () => rimraf(path.join(paths.target, 'render.js'));

const compileAll = () => Promise.all(webpackConfigs.map(runWebpack));

const copyPublicFiles = () => {
  if (fs.existsSync(paths.public)) {
    fs.copySync(paths.public, paths.target, {
      dereference: true
    });
    console.log(`Copying ${paths.public} to ${paths.target}`);
  }
};

cleanDistFolders()
  .then(compileAll)
  .then(cleanRenderJs)
  .then(copyPublicFiles)
  .then(() => console.log('Sku build complete!'))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
