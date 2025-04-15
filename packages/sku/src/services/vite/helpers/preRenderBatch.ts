import { mockAdapter, setAdapter } from '@vanilla-extract/css/adapter';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { workerData } from 'node:worker_threads';
import {
  outDir,
  renderEntryChunkName,
} from '@/services/vite/helpers/bundleConfig.js';
import { createCollector } from '@/services/vite/loadable/collector.js';
import { createPreRenderedHtml } from '@/services/vite/helpers/html/createPreRenderedHtml.js';
import createCSPHandler from '@/services/webpack/entry/csp.js';
import { ensureTargetDirectory } from '@/utils/buildFileUtils.js';
import type { JobWorkerData } from '@/services/vite/helpers/prerenderRoutesWorker.js';

setAdapter(mockAdapter);

const resolve = (p: string) => path.resolve(process.cwd(), p);

const [manifest, render] = await Promise.all([
  readFile(resolve('./dist/.vite/manifest.json'), 'utf-8').then(JSON.parse),
  import(resolve(path.join(outDir.ssg, renderEntryChunkName))).then(
    (m) => m.default,
  ),
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
      // TODO: It would be nice to type this file properly
      const loadableCollector = createCollector({
        manifest,
        base: publicPath.startsWith('/') ? '/' : '',
      });

      let html = await createPreRenderedHtml({
        environment,
        language,
        route,
        routeName,

        site,
        render,
        loadableCollector,
      });

      if (cspEnabled) {
        const cspHandler = createCSPHandler({
          extraHosts: [publicPath, ...cspExtraScriptSrcHosts],
          isDevelopment: process.env.NODE_ENV === 'development',
        });

        html = cspHandler.handleHtml(html);
      }

      await ensureTargetDirectory(filePath.split('/').slice(0, -1).join('/'));
      try {
        await writeFile(resolve(filePath), html);
      } catch (e) {
        console.error('Error writing file', filePath, e);
      }

      // Make this a nicer log.
      console.log(`Static Site Generation for route: ${route} to ${filePath}`);
    },
  ),
);
