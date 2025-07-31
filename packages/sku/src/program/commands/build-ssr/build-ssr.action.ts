import { performance } from 'node:perf_hooks';
import prettyMilliseconds from 'pretty-ms';
import webpack from 'webpack';
import chalk from 'chalk';
import { run } from '#src/services/webpack/runWebpack.js';
import {
  copyPublicFiles,
  cleanTargetDirectory,
  ensureTargetDirectory,
} from '#src/utils/buildFileUtils.js';
import makeWebpackConfig from '#src/services/webpack/config/webpack.config.ssr.js';
import provider from '#src/services/telemetry/index.js';

import { runVocabCompile } from '#src/services/vocab/runVocab.js';
import { configureProject, validatePeerDeps } from '#src/utils/configure.js';
import type { StatsChoices } from '#src/program/options/stats/stats.option.js';
import type { SkuContext } from '#src/context/createSkuContext.js';

export const buildSsrAction = async ({
  stats,
  skuContext,
}: {
  stats: StatsChoices;
  skuContext: SkuContext;
}) => {
  if (skuContext.bundler === 'vite') {
    throw new Error(
      'The command does not supported the Vite bundler at this time. SSR is only supported with Webpack.',
    );
  }
  // First, ensure the build is running in production mode
  process.env.NODE_ENV = 'production';
  const { port, cspEnabled } = skuContext;
  await configureProject(skuContext);
  validatePeerDeps(skuContext);
  try {
    await runVocabCompile(skuContext);
    const [clientConfig, serverConfig] = makeWebpackConfig({
      clientPort: port.client,
      serverPort: port.server,
      stats,
      skuContext,
    });
    await ensureTargetDirectory(skuContext.paths.target);
    await cleanTargetDirectory(skuContext.paths.target);
    await run(webpack(clientConfig), { stats });
    await run(webpack(serverConfig), { stats });
    await copyPublicFiles(skuContext);

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
