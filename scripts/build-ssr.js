// First, ensure the build is running in production mode
process.env.NODE_ENV = 'production';

const webpack = require('webpack');

const { run } = require('../lib/runWebpack');
const {
  copyPublicFiles,
  cleanTargetFolder,
  ensureTargetDirectory
} = require('../lib/buildFileUtils');
const [
  clientConfig,
  serverConfig
] = require('../config/webpack/webpack.config.ssr');

(async () => {
  try {
    await ensureTargetDirectory();
    await cleanTargetFolder();
    await run(webpack(clientConfig));
    await run(webpack(serverConfig));
    await copyPublicFiles();

    console.log('Sku build complete!');
  } catch (e) {
    console.log(e);

    process.exit(1);
  }
})();
