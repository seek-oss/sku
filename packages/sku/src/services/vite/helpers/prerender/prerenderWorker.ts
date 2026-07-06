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
    cspDelivery,
    cspExtraScriptSrcHosts,
    cspReportOnlyEnabled,
    cspReportOnlyExtraScriptSrcHosts,
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

      if (cspEnabled || cspReportOnlyEnabled) {
        cspHandler = createCSPHandler({
          extraHosts: cspEnabled
            ? [publicPath, ...cspExtraScriptSrcHosts]
            : undefined,
          reportOnlyExtraHosts: cspReportOnlyEnabled
            ? [publicPath, ...cspReportOnlyExtraScriptSrcHosts]
            : undefined,
          isDevelopment: process.env.NODE_ENV === 'development',
        });
      }

      const metadata: { csp?: string; cspReportOnly?: string } = {};
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
          const root = cspHandler.processHtml(html);

          if (cspEnabled) {
            if (cspDelivery === 'tag') {
              html = cspHandler.updateHtml(root);
            } else if (cspDelivery === 'header') {
              metadata.csp = cspHandler.createCSP();
            }
          }

          if (cspReportOnlyEnabled) {
            metadata.cspReportOnly = cspHandler.createReportOnlyCSP();
          }
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

      if (Object.keys(metadata).length !== 0) {
        const json = JSON.stringify({ metadata }, null, 2);

        try {
          console.log(
            `Writing metadata for route "${route}" to "${relativeOutputPath}.json"`,
          );
          await writeFile(`${filePath}.json`, json);
        } catch (e) {
          throw new Error(
            `Error writing file to "${relativeOutputPath}.json"`,
            { cause: e },
          );
        }
      }
    },
  ),
);
