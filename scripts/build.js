// First, ensure the build is running in production mode
process.env.NODE_ENV = 'production';

const { promisify } = require('es6-promisify');
const webpackPromise = promisify(require('webpack'));
const webpackConfigs = require('../config/webpack/webpack.config');
const fs = require('fs-extra');
const builds = require('../config/builds');
const rimraf = promisify(require('rimraf'));

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

const cleanDistFolders = () =>
  Promise.all(builds.map(({ paths }) => rimraf(`${paths.dist}/*`)));

const compileAll = () => Promise.all(webpackConfigs.map(runWebpack));

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

cleanDistFolders()
  .then(compileAll)
  .then(copyPublicFiles)
  .then(() => console.log('Sku build complete!'))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
