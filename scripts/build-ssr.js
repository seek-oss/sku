// First, ensure the build is running in production mode
process.env.NODE_ENV = 'production';

const webpack = require('webpack');
const { promisify } = require('util');
const rimraf = promisify(require('rimraf'));

const { run } = require('../lib/runWebpack');
const copyPublicFiles = require('../lib/copyPublicFiles');
const [
  clientConfig,
  serverConfig
] = require('../config/webpack/webpack.config.ssr');
const { paths } = require('../context');

const cleanTargetFolder = () => rimraf(`${paths.target}/*`);

(async () => {
  try {
    await cleanTargetFolder();
    await run(webpack(clientConfig));
    console.log('Client webpack done');

    await run(webpack(serverConfig));
    console.log('Server webpack done');

    await copyPublicFiles();

    console.log('Sku build complete!');
  } catch (e) {
    console.log(e);

    process.exit(1);
  }
})();
