import path from 'node:path';
import { Worker } from 'node:worker_threads';
import os from 'node:os';
import { getBuildRoutes } from '../../../webpack/config/plugins/createHtmlRenderPlugin.js';
import type { SkuContext } from '../../../../context/createSkuContext.js';
import type { Manifest } from 'vite';
import { readFile } from 'node:fs/promises';
import { success } from '@sku-private/utils/console';

export type Job = {
  filePath: string;
  environment: string;
  language: string;
  route: string;
  routeName: string;
  site: string;
};

export type SharedWorkerData = {
  publicPath: string;
  cspEnabled: boolean;
  cspDelivery: 'tag' | 'header';
  cspExtraScriptSrcHosts: string[];
  targetPath: string;
  manifest: Manifest;
};

export type WorkerData = {
  jobs: Job[];
  sharedWorkerData: SharedWorkerData;
};

export class PrerenderWorkerError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'PrerenderWorkerError';
  }
}

const runJobs = (
  jobs: Job[],
  sharedWorkerData: SharedWorkerData,
): Promise<void> => {
  const workerPath = new URL(import.meta.resolve('#vite/prerender-worker'));
  const workerData: WorkerData = {
    jobs,
    sharedWorkerData,
  };
  const worker = new Worker(workerPath, {
    workerData,
    execArgv: ['--enable-source-maps'],
  });

  return new Promise((resolve, reject) => {
    worker.on('error', (error) => {
      reject(new PrerenderWorkerError(error.message, { cause: error.cause }));
    });

    worker.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
};

const getFileName = (
  skuContext: SkuContext,
  skuRoute: ReturnType<typeof getBuildRoutes>[0],
) => {
  let renderDirectory = skuContext.paths.target;
  const relativeFilePath = skuContext.transformOutputPath(skuRoute);
  const includesHtmlInFilePath = relativeFilePath.endsWith('.html');
  if (!path.isAbsolute(renderDirectory)) {
    renderDirectory = path.resolve(renderDirectory);
  }
  return includesHtmlInFilePath
    ? path.join(renderDirectory, relativeFilePath)
    : path.join(renderDirectory, relativeFilePath, 'index.html');
};

export const prerenderConcurrently = async (skuContext: SkuContext) => {
  const routes = getBuildRoutes(skuContext);

  const targetPath = skuContext.paths.target;

  const jobs = routes.map((route) => ({
    route: route.route,
    routeName: route.routeName,
    site: route.site,
    filePath: getFileName(skuContext, route),
    environment: route.environment,
    language: route.language,
  }));

  const rawManifest = await readFile(
    path.resolve(path.join(targetPath, '.vite/manifest.json')),
    'utf-8',
  );

  const sharedWorkerData = {
    publicPath: skuContext.publicPath,
    cspEnabled: skuContext.cspEnabled,
    cspDelivery: skuContext.cspDelivery,
    cspExtraScriptSrcHosts: skuContext.cspExtraScriptSrcHosts,
    targetPath,
    manifest: JSON.parse(rawManifest) as Manifest,
  };

  const cores = Math.min(os.availableParallelism(), jobs.length);
  const chunkSize = Math.ceil(jobs.length / cores);

  await Promise.all(
    Array.from({ length: cores }, (_, i) =>
      runJobs(jobs.slice(i * chunkSize, (i + 1) * chunkSize), sharedWorkerData),
    ),
  );

  console.log(success(`Finished pre-rendering ${routes.length} pages`));
};
