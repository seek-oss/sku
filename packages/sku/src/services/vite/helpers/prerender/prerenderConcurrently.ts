import path from 'node:path';
import url from 'node:url';
import { Worker } from 'node:worker_threads';
import os from 'node:os';
import { getBuildRoutes } from '@/services/webpack/config/plugins/createHtmlRenderPlugin.js';
import type { SkuContext } from '@/context/createSkuContext.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const toAbsolute = (p: string) => path.resolve(__dirname, p);

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
};

const runJobs = (jobs: JobWorkerData[]): Promise<void> => {
  const worker = new Worker(toAbsolute('./prerenderWorker.js'), {
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

export const prerenderConcurrently = async (skuContext: SkuContext) => {
  const routes = getBuildRoutes(skuContext);

  const getFileName = (skuRoute: ReturnType<typeof getBuildRoutes>[0]) => {
    let renderDirectory = skuContext.skuConfig.target;
    const relativeFilePath = skuContext.transformOutputPath(skuRoute);
    const includesHtmlInFilePath = relativeFilePath.endsWith('.html');
    if (!path.isAbsolute(renderDirectory)) {
      renderDirectory = path.resolve(renderDirectory);
    }
    return includesHtmlInFilePath
      ? path.join(renderDirectory, relativeFilePath)
      : path.join(renderDirectory, relativeFilePath, 'index.html');
  };

  const jobs = routes.map((route) => ({
    route: route.route,
    routeName: route.routeName,
    site: route.site,
    filePath: getFileName(route),
    publicPath: skuContext.publicPath,
    environment: route.environment,
    cspEnabled: skuContext.cspEnabled,
    cspExtraScriptSrcHosts: skuContext.cspExtraScriptSrcHosts,
    language: route.language,
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
