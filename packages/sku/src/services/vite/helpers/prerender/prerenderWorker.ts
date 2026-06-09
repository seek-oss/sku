import { mockAdapter, setAdapter } from '@vanilla-extract/css/adapter';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import { workerData } from 'node:worker_threads';
import { createOutDir, renderEntryChunkName } from '../bundleConfig.js';
import { createCollector } from '@sku-lib/vite/collector';
import { createPreRenderedHtml } from '../html/createPreRenderedHtml.js';
import createCSPHandler, {
  type CSPHandler,
} from '../../../webpack/entry/csp.js';
import { ensureTargetDirectory } from '../../../../utils/buildFileUtils.js';

import type { WorkerData } from './prerenderConcurrently.js';
import type { Render } from '../../../../types/types.js';

// Vite handles generating Vanilla Extract CSS during its build, so we set a mock adapter
// to prevent Vanilla Extract errors during pre-rendering.
setAdapter(mockAdapter);

const typedWorkerData = workerData as WorkerData;
if (!typedWorkerData || typedWorkerData.jobs.length === 0) {
  // No jobs assigned to this worker, exit gracefully
  process.exit(0);
}

const {
  sharedWorkerData: {
    cspEnabled,
    cspExtraScriptSrcHosts,
    manifest,
    publicPath,
    targetPath,
  },
  jobs,
} = typedWorkerData;

if (!targetPath) {
  throw new Error('targetPath is required in workerData');
}

const outDir = createOutDir(targetPath);

let render: Render;
try {
  const renderModule = await import(
    path.join(outDir.ssg, renderEntryChunkName)
  );
  render = renderModule.default;
} catch (e) {
  throw new Error(`Error importing sku render entrypoint`, { cause: e });
}

await Promise.all(
  jobs.map(
    async ({ environment, filePath, site, route, routeName, language }) => {
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
      const relativeOutputPath = path.relative(process.cwd(), filePath);

      try {
        console.log(
          `Writing HTML for route "${route}" to "${relativeOutputPath}"`,
        );
        await writeFile(filePath, html);
      } catch (e) {
        throw new Error(`Error writing file to "${relativeOutputPath}"`, {
          cause: e,
        });
      }
    },
  ),
);
