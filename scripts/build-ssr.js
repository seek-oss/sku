// First, ensure the build is running in production mode
process.env.NODE_ENV = 'production';

const { performance } = require('perf_hooks');
const prettyMilliseconds = require('pretty-ms');
const webpack = require('webpack');
const { green, red } = require('chalk');
const { run } = require('../lib/runWebpack');
const {
  copyPublicFiles,
  cleanTargetDirectory,
  ensureTargetDirectory,
} = require('../lib/buildFileUtils');
const makeWebpackConfig = require('../config/webpack/webpack.config.ssr');
const { port, cspEnabled } = require('../context');
const track = require('../telemetry');

(async () => {
  try {
    const [clientConfig, serverConfig] = makeWebpackConfig({
      clientPort: port.client,
      serverPort: port.server,
    });
    await ensureTargetDirectory();
    await cleanTargetDirectory();
    await run(webpack(clientConfig));
    await run(webpack(serverConfig));
    await copyPublicFiles();

    const timeTaken = performance.now();
    track.timing('build', timeTaken, {
      status: 'success',
      type: 'ssr',
      csp: cspEnabled,
    });

    console.log(
      green(`Sku build complete in ${prettyMilliseconds(timeTaken)}`),
    );
  } catch (error) {
    const timeTaken = performance.now();
    track.timing('build', timeTaken, {
      status: 'failed',
      type: 'ssr',
      csp: cspEnabled,
    });

    console.error(red(error));

    process.exitCode = 1;
  } finally {
    await track.close();
  }
})();
