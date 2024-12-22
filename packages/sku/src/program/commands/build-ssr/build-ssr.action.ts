import { performance } from 'node:perf_hooks';
import prettyMilliseconds from 'pretty-ms';
import webpack from 'webpack';
import chalk from 'chalk';
import { run } from '@/services/webpack/runWebpack.js';
import {
  copyPublicFiles,
  cleanTargetDirectory,
  ensureTargetDirectory,
} from '@/utils/buildFileUtils.js';
import makeWebpackConfig from '@/services/webpack/config/webpack.config.ssr.js';
import provider from '@/telemetry/index.js';

import { runVocabCompile } from '@/services/vocab/runVocab.js';
import { configureProject, validatePeerDeps } from '@/utils/configure.js';
import type { StatsChoices } from '@/program/options/stats/stats.option.js';
import { SkuContext } from '@/context/createSkuContext.js';

export const buildSsrAction = async ({
  stats,
  skuContext,
}: {
  stats: StatsChoices;
  skuContext: SkuContext;
}) => {
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
    await ensureTargetDirectory(skuContext);
    await cleanTargetDirectory(skuContext);
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
