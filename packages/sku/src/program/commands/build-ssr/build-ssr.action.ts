import { performance } from 'node:perf_hooks';
import webpack from 'webpack';
import { run } from '../../../services/webpack/runWebpack.js';
import {
  copyPublicFiles,
  cleanTargetDirectory,
  ensureTargetDirectory,
} from '../../../utils/buildFileUtils.js';
import { makeWebpackConfig } from '../../../services/webpack/config/webpack.config.ssr.js';
import provider from '../../../services/telemetry/index.js';

import { runVocabCompile } from '../../../services/vocab/runVocab.js';
import {
  configureProject,
  validatePeerDeps,
} from '../../../utils/configure.js';
import { validatePolyfills } from '../../../utils/polyfillWarnings.js';
import type { StatsChoices } from '../../options/stats.option.js';
import type { SkuContext } from '../../../context/createSkuContext.js';
import { critical, success } from '@sku-private/utils/console';
import { formatMs } from '../../../utils/formatMs.js';

export const buildSsrAction = async ({
  stats,
  skuContext,
}: {
  stats: StatsChoices;
  skuContext: SkuContext;
}) => {
  if (skuContext.buildType) {
    throw new Error(
      '`sku build-ssr` is not used with `buildType`. Use `sku build` instead.',
    );
  }

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
  validatePolyfills(skuContext.polyfills);

  try {
    await runVocabCompile(skuContext);
    const [clientConfig, serverConfig] = await makeWebpackConfig({
      serverPort: port.server,
      stats,
      skuContext,
    });
    await ensureTargetDirectory(skuContext.paths.target);
    await cleanTargetDirectory(skuContext.paths.target);

    const clientCompiler = webpack(clientConfig);
    if (!clientCompiler) {
      throw new Error('Failed to create client webpack compiler');
    }

    const serverCompiler = webpack(serverConfig);
    if (!serverCompiler) {
      throw new Error('Failed to create server webpack compiler');
    }

    await run(clientCompiler, { stats });
    await run(serverCompiler, { stats });
    await copyPublicFiles(skuContext);

    const timeTaken = performance.now();
    provider.timing('build', timeTaken, {
      status: 'success',
      type: 'ssr',
      csp: cspEnabled,
    });

    console.log(success(`Sku build complete in ${formatMs(timeTaken)}`));
  } catch (error) {
    const timeTaken = performance.now();
    provider.timing('build', timeTaken, {
      status: 'failed',
      type: 'ssr',
      csp: cspEnabled,
    });

    console.error(critical(String(error)));

    process.exitCode = 1;
  } finally {
    await provider.close();

    if (process.env.SKU_FORCE_EXIT) {
      process.exit();
    }
  }
};
