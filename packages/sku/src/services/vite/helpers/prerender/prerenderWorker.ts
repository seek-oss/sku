import { mockAdapter, setAdapter } from '@vanilla-extract/css/adapter';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { workerData } from 'node:worker_threads';
import { createOutDir, renderEntryChunkName } from '../bundleConfig.js';
import { createCollector } from '@sku-lib/vite/collector';
import { createPreRenderedHtml } from '../html/createPreRenderedHtml.js';
import createCSPHandler, {
  type CSPHandler,
} from '../../../webpack/entry/csp.js';
import { ensureTargetDirectory } from '../../../../utils/buildFileUtils.js';

import type { JobWorkerData } from './prerenderConcurrently.js';

setAdapter(mockAdapter);

const resolve = (p: string) => path.resolve(process.cwd(), p);

if (!workerData || workerData.length === 0) {
  // No jobs assigned to this worker, exit gracefully
  process.exit(0);
}

const { targetPath } = workerData[0];
if (!targetPath) {
  throw new Error('targetPath is required in workerData');
}

const outDir = createOutDir(targetPath);

const [manifest, render] = await Promise.all([
  readFile(resolve(path.join(targetPath, '.vite/manifest.json')), 'utf-8').then(
    JSON.parse,
  ),
  import(resolve(path.join(outDir.ssg, renderEntryChunkName)))
    .then((m) => m.default)
    .catch((e) => {
      throw new Error(`Error importing sku render entrypoint`, { cause: e });
    }),
]);

await Promise.all(
  workerData.map(
    async ({
      publicPath,
      environment,
      filePath,
      cspExtraScriptSrcHosts,
      cspEnabled,
      site,
      route,
      routeName,
      language,
    }: JobWorkerData) => {
      const loadableCollector = createCollector({
        manifest,
        base: publicPath,
      });

      let cspHandler: CSPHandler | undefined;

      if (cspEnabled) {
        cspHandler = createCSPHandler({
          extraHosts: [publicPath, ...cspExtraScriptSrcHosts],
          isDevelopment: process.env.NODE_ENV === 'development',
        });
      }

      let html = '';
      try {
        html = await createPreRenderedHtml({
          environment,
          language,
          route,
          routeName,
          site,
          render,
          loadableCollector,
          createUnsafeNonce: cspHandler
            ? cspHandler.createUnsafeNonce
            : undefined,
        });

        if (cspHandler) {
          html = cspHandler.handleHtml(html);
        }
      } catch (e) {
        throw new Error(`Error rendering HTML for route "${route}"`, {
          cause: e,
        });
      }

      await ensureTargetDirectory(path.dirname(filePath));
      try {
        await writeFile(resolve(filePath), html);
      } catch (e) {
        throw new Error(`Error writing file ${filePath}`, { cause: e });
      }

      // Make this a nicer log.
      console.log(`Static Site Generation for route: ${route} to ${filePath}`);
    },
  ),
);
