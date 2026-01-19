import path from 'node:path';
import { Worker } from 'node:worker_threads';
import os from 'node:os';
import { getBuildRoutes } from '../../../webpack/config/plugins/createHtmlRenderPlugin.js';
import type { SkuContext } from '../../../../context/createSkuContext.js';

export type JobWorkerData = {
  publicPath: string;
  filePath: string;
  cspEnabled: boolean;
  cspExtraScriptSrcHosts: string[];
  environment: string;
  language: string;
  route: string;
  routeName: string;
  site: string;
  targetPath: string;
};

const runJobs = (jobs: JobWorkerData[]): Promise<void> => {
  const workerPath = new URL(import.meta.resolve('#vite/prerender-worker'));
  const worker = new Worker(workerPath, {
    workerData: jobs,
  });

  return new Promise((resolve, reject) => {
    worker.on('error', reject);

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

  const jobs = routes.map((route) => ({
    route: route.route,
    routeName: route.routeName,
    site: route.site,
    filePath: getFileName(skuContext, route),
    publicPath: skuContext.publicPath,
    environment: route.environment,
    cspEnabled: skuContext.cspEnabled,
    cspExtraScriptSrcHosts: skuContext.cspExtraScriptSrcHosts,
    language: route.language,
    targetPath: skuContext.paths.target,
  }));

  // If we have more jobs than CPU cores, we need to split the jobs into chunks
  const cpus = os.cpus().length > jobs.length ? jobs.length : os.cpus().length;
  const chunkSize = Math.ceil(jobs.length / cpus);

  await Promise.all(
    Array.from({ length: cpus }, (_, i) =>
      runJobs(jobs.slice(i * chunkSize, (i + 1) * chunkSize)),
    ),
  );
};
