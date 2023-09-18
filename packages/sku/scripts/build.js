// First, ensure the build is running in production mode
process.env.NODE_ENV = 'production';

const prettyMilliseconds = require('pretty-ms');
const { green, red } = require('chalk');
const webpack = require('webpack');
const { performance } = require('node:perf_hooks');

const {
  copyPublicFiles,
  cleanTargetDirectory,
  ensureTargetDirectory,
  cleanRenderJs,
} = require('../lib/buildFileUtils');
const { run } = require('../lib/runWebpack');
const createHtmlRenderPlugin = require('../config/webpack/plugins/createHtmlRenderPlugin');
const makeWebpackConfig = require('../config/webpack/webpack.config');
const { isLibrary, cspEnabled } = require('../context');
const track = require('../telemetry');
const { runVocabCompile } = require('../lib/runVocab');

(async () => {
  try {
    await runVocabCompile();
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
    track.timing('build', timeTaken, {
      status: 'success',
      type: 'static',
      csp: cspEnabled,
    });

    console.log(
      green(`Sku build complete in ${prettyMilliseconds(timeTaken)}`),
    );
  } catch (error) {
    const timeTaken = performance.now();
    track.timing('build', timeTaken, {
      status: 'failed',
      type: 'static',
      csp: cspEnabled,
    });

    console.error(red(error));

    process.exitCode = 1;
  } finally {
    await track.close();

    if (process.env.SKU_FORCE_EXIT) {
      process.exit();
    }
  }
})();
