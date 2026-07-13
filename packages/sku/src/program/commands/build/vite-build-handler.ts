import type { SkuContext } from '../../../context/createSkuContext.js';
import {
  configureProject,
  validatePeerDeps,
} from '../../../utils/configure.js';
import { runVocabCompile } from '../../../services/vocab/runVocab.js';
import { performance } from 'node:perf_hooks';
import provider from '../../../services/telemetry/index.js';
import { viteService } from '../../../services/vite/index.js';
import { PrerenderWorkerError } from '../../../services/vite/helpers/prerender/prerenderConcurrently.js';
import { critical, success } from '@sku-private/utils/console';
import { formatMs } from '../../../utils/formatMs.js';

export const viteBuildHandler = async ({
  skuContext,
}: {
  skuContext: SkuContext;
}) => {
  // First, ensure the build is running in production mode
  process.env.NODE_ENV = 'production';

  const { cspEnabled } = skuContext;
  await configureProject(skuContext);
  validatePeerDeps(skuContext);

  try {
    await runVocabCompile(skuContext);

    await viteService.build(skuContext);

    const buildType =
      skuContext.renderType === 'server-side-rendered' ? 'ssr' : 'static';
    const timeTaken = performance.now();
    provider.timing('build', timeTaken, {
      status: 'success',
      type: buildType,
      csp: cspEnabled,
    });

    console.log(success(`Sku build complete in ${formatMs(timeTaken)}`));
  } catch (error) {
    const buildType =
      skuContext.renderType === 'server-side-rendered' ? 'ssr' : 'static';
    const timeTaken = performance.now();
    provider.timing('build', timeTaken, {
      status: 'failed',
      type: buildType,
      csp: cspEnabled,
    });

    if (error instanceof PrerenderWorkerError) {
      console.error(critical(error.message));
      console.error(error.cause);
    } else if (error instanceof Error) {
      console.error(critical(error.message));
      console.error(error.stack);
    } else {
      console.error(critical(String(error)));
    }

    process.exitCode = 1;
  } finally {
    await provider.close();

    if (process.env.SKU_FORCE_EXIT) {
      process.exit();
    }
  }
};
