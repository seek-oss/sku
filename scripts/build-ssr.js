// First, ensure the build is running in production mode
process.env.NODE_ENV = 'production';

const webpack = require('webpack');
const { green, red } = require('chalk');
const { run } = require('../lib/runWebpack');
const {
  copyPublicFiles,
  cleanTargetDirectory,
  ensureTargetDirectory
} = require('../lib/buildFileUtils');
const [
  clientConfig,
  serverConfig
] = require('../config/webpack/webpack.config.ssr');

(async () => {
  try {
    await ensureTargetDirectory();
    await cleanTargetDirectory();
    await run(webpack(clientConfig));
    await run(webpack(serverConfig));
    await copyPublicFiles();

    console.log(green('Sku build complete!'));
  } catch (e) {
    console.error(red(e));

    process.exit(1);
  }
})();
