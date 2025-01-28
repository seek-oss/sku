import type { SkuContext } from '@/context/createSkuContext.js';
import { configureProject, validatePeerDeps } from '@/utils/configure.js';
import { runVocabCompile } from '@/services/vocab/runVocab.js';
import {
  cleanStaticRenderEntry,
  cleanTargetDirectory,
  copyPublicFiles,
  ensureTargetDirectory,
} from '@/utils/buildFileUtils.js';
import { performance } from 'node:perf_hooks';
import provider from '@/services/telemetry/index.js';
import chalk from 'chalk';
import prettyMilliseconds from 'pretty-ms';
import { viteService } from '@/services/vite/index.js';

export const viteBuildSsrHandler = async ({
  skuContext,
}: {
  skuContext: SkuContext;
}) => {
  // First, ensure the build is running in production mode
  process.env.NODE_ENV = 'production';

  const { cspEnabled, paths } = skuContext;
  await configureProject(skuContext);
  validatePeerDeps(skuContext);

  try {
    await runVocabCompile(skuContext);
    await ensureTargetDirectory({ paths });
    await cleanTargetDirectory({ paths });

    await viteService.buildSsr(skuContext);

    await cleanStaticRenderEntry({ paths });
    await copyPublicFiles({ paths });
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
