import prettyMilliseconds from 'pretty-ms';
import chalk from 'chalk';
import webpack from 'webpack';
import { performance } from 'node:perf_hooks';

import {
  copyPublicFiles,
  cleanTargetDirectory,
  ensureTargetDirectory,
  cleanStaticRenderEntry,
} from '#src/utils/buildFileUtils.js';
import { run } from '#src/services/webpack/runWebpack.js';
import createHtmlRenderPlugin from '#src/services/webpack/config/plugins/createHtmlRenderPlugin.js';
import makeWebpackConfig from '#src/services/webpack/config/webpack.config.js';
import provider from '#src/services/telemetry/index.js';
import { runVocabCompile } from '#src/services/vocab/runVocab.js';
import { configureProject, validatePeerDeps } from '#src/utils/configure.js';
import type { StatsChoices } from '#src/program/options/stats/stats.option.js';
import type { SkuContext } from '#src/context/createSkuContext.js';

export const webpackBuildHandler = async ({
  stats,
  skuContext,
}: {
  stats: StatsChoices;
  skuContext: SkuContext;
}) => {
  // First, ensure the build is running in production mode
  process.env.NODE_ENV = 'production';
  const { isLibrary, cspEnabled, paths } = skuContext;
  await configureProject(skuContext);
  validatePeerDeps(skuContext);
  try {
    await runVocabCompile(skuContext);
    await ensureTargetDirectory(paths.target);
    await cleanTargetDirectory(paths.target);
    await run(
      webpack(
        makeWebpackConfig({
          htmlRenderPlugin: !isLibrary
            ? createHtmlRenderPlugin({
                isStartScript: false,
                skuContext,
              })
            : undefined,
          stats,
          skuContext,
        }),
      ),
      { stats },
    );
    await cleanStaticRenderEntry({ paths });
    await copyPublicFiles({ paths });

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
