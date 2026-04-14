import type { SkuContext } from '../../../context/createSkuContext.js';
import {
  configureProject,
  validatePeerDeps,
} from '../../../utils/configure.js';
import { runVocabCompile } from '../../../services/vocab/runVocab.js';
import { performance } from 'node:perf_hooks';
import provider from '../../../services/telemetry/index.js';
import prettyMilliseconds from 'pretty-ms';
import { viteService } from '../../../services/vite/index.js';
import { styleText } from 'node:util';
import { PrerenderWorkerError } from '../../../services/vite/helpers/prerender/prerenderConcurrently.js';

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

    const timeTaken = performance.now();
    provider.timing('build', timeTaken, {
      status: 'success',
      type: 'static',
      csp: cspEnabled,
    });

    console.log(
      styleText(
        'green',
        `Sku build complete in ${prettyMilliseconds(timeTaken)}`,
      ),
    );
  } catch (error) {
    const timeTaken = performance.now();
    provider.timing('build', timeTaken, {
      status: 'failed',
      type: 'static',
      csp: cspEnabled,
    });

    if (error instanceof PrerenderWorkerError) {
      console.error(styleText('red', error.message));
      console.error(error.cause);
    } else if (error instanceof Error) {
      console.error(styleText('red', error.message));
      console.error(error.stack);
    } else {
      console.error(styleText('red', String(error)));
    }

    process.exitCode = 1;
  } finally {
    await provider.close();

    if (process.env.SKU_FORCE_EXIT) {
      process.exit();
    }
  }
};
