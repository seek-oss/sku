import prettyMilliseconds from 'pretty-ms';
import chalk from 'chalk';
import webpack from 'webpack';
import { performance } from 'node:perf_hooks';

import {
  copyPublicFiles,
  cleanTargetDirectory,
  ensureTargetDirectory,
  cleanStaticRenderEntry,
} from '../../../buildFileUtils.js';
import { run } from '../../../runWebpack.js';
import createHtmlRenderPlugin from '../../../../config/webpack/plugins/createHtmlRenderPlugin.js';
import makeWebpackConfig from '../../../../config/webpack/webpack.config.js';
import { isLibrary, cspEnabled } from '../../../../context/index.js';
import provider from '../../../../telemetry/index.js';
import { runVocabCompile } from '../../../runVocab.js';
import {
  configureProject,
  validatePeerDeps,
} from '../../../utils/configure.js';

// First, ensure the build is running in production mode
process.env.NODE_ENV = 'production';

const buildAction = async ({ stats }) => {
  await configureProject();
  validatePeerDeps();
  try {
    await runVocabCompile();
    await ensureTargetDirectory();
    await cleanTargetDirectory();
    await run(
      webpack(
        makeWebpackConfig({
          htmlRenderPlugin: !isLibrary ? createHtmlRenderPlugin() : undefined,
          stats,
        }),
      ),
      { stats },
    );
    await cleanStaticRenderEntry();
    await copyPublicFiles();

    const timeTaken = performance.now();
    provider.timing('build', timeTaken, {
      status: 'success',
      type: 'static',
      csp: cspEnabled,
    });

    console.log(
      chalk.green(`Sku build complete in ${prettyMilliseconds(timeTaken)}`),
    );
  } catch (error) {
    const timeTaken = performance.now();
    provider.timing('build', timeTaken, {
      status: 'failed',
      type: 'static',
      csp: cspEnabled,
    });

    console.error(chalk.red(error));

    process.exitCode = 1;
  } finally {
    await provider.close();

    if (process.env.SKU_FORCE_EXIT) {
      process.exit();
    }
  }
};

export { buildAction };
