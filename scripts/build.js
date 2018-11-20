// First, ensure the build is running in production mode
process.env.NODE_ENV = 'production';

const path = require('path');
const { promisify } = require('util');
const rimraf = promisify(require('rimraf'));

const {
  copyPublicFiles,
  cleanTargetFolder,
  ensureTargetDirectory
} = require('../lib/fileUtils');

const { run } = require('../lib/runWebpack');
const webpackCompiler = require('../config/webpack/webpack.config');
const { paths } = require('../context');

const cleanRenderJs = () => rimraf(path.join(paths.target, 'render.js'));

(async () => {
  try {
    await ensureTargetDirectory();
    await cleanTargetFolder();
    await run(webpackCompiler);
    await cleanRenderJs();
    await copyPublicFiles();
    console.log('Sku build complete!');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
