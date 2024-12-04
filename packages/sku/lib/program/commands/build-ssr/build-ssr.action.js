import { performance } from 'node:perf_hooks';
import prettyMilliseconds from 'pretty-ms';
import webpack from 'webpack';
import chalk from 'chalk';
import { run } from '../../../runWebpack.js';
import {
  copyPublicFiles,
  cleanTargetDirectory,
  ensureTargetDirectory,
} from '../../../buildFileUtils.js';
import makeWebpackConfig from '../../../../config/webpack/webpack.config.ssr.js';
import { port, cspEnabled } from '../../../../context/index.js';
import provider from '../../../../telemetry/index.js';

import { runVocabCompile } from '../../../runVocab.js';
import {
  configureProject,
  validatePeerDeps,
} from '../../../utils/configure.js';

// First, ensure the build is running in production mode
process.env.NODE_ENV = 'production';

export const buildSsrAction = async ({ stats }) => {
  await configureProject();
  validatePeerDeps();
  try {
    await runVocabCompile();
    const [clientConfig, serverConfig] = makeWebpackConfig({
      clientPort: port.client,
      serverPort: port.server,
      stats,
    });
    await ensureTargetDirectory();
    await cleanTargetDirectory();
    await run(webpack(clientConfig), { stats });
    await run(webpack(serverConfig), { stats });
    await copyPublicFiles();

    const timeTaken = performance.now();
    provider.timing('build', timeTaken, {
      status: 'success',
      type: 'ssr',
      csp: cspEnabled,
    });

    console.log(
      chalk.green(`Sku build complete in ${prettyMilliseconds(timeTaken)}`),
    );
  } catch (error) {
    const timeTaken = performance.now();
    provider.timing('build', timeTaken, {
      status: 'failed',
      type: 'ssr',
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
