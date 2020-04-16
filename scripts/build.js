// First, ensure the build is running in production mode
process.env.NODE_ENV = 'production';

const prettyMilliseconds = require('pretty-ms');
const { green, red } = require('chalk');
const webpack = require('webpack');
const { performance } = require('perf_hooks');

const {
  copyPublicFiles,
  cleanTargetDirectory,
  ensureTargetDirectory,
  cleanRenderJs,
} = require('../lib/buildFileUtils');
const { run } = require('../lib/runWebpack');
const createHtmlRenderPlugin = require('../config/webpack/plugins/createHtmlRenderPlugin');
const makeWebpackConfig = require('../config/webpack/webpack.config');
const { isLibrary } = require('../context');
const track = require('../telemetry');

(async () => {
  try {
    await ensureTargetDirectory();
    await cleanTargetDirectory();
    await run(
      webpack(
        makeWebpackConfig({
          htmlRenderPlugin: !isLibrary ? createHtmlRenderPlugin() : undefined,
        }),
      ),
    );
    await cleanRenderJs();
    await copyPublicFiles();

    const timeTaken = performance.now();
    track.timing('build', timeTaken, { status: 'success' });

    console.log(
      green(`Sku build complete in ${prettyMilliseconds(timeTaken)}`),
    );
  } catch (error) {
    const timeTaken = performance.now();
    track.timing('build', timeTaken, { status: 'failed' });

    console.error(red(error));

    process.exitCode = 1;
  } finally {
    await track.close();
  }
})();
