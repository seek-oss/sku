import path from 'node:path';
import { createBuilder } from 'vite';

import type { SkuContext } from '../../../context/createSkuContext.js';
import {
  assertNoPublicHtmlFiles,
  cleanTargetDirectory,
  copyPublicFiles,
  ensureTargetDirectory,
} from '../../../utils/buildFileUtils.js';
import { createOutDir } from '../helpers/bundleConfig.js';
import { createConfig } from '../helpers/config/createConfig.js';
import { prerenderConcurrently } from '../helpers/prerender/prerenderConcurrently.js';

export const buildStatic = async (skuContext: SkuContext) => {
  const { distSubfolders } = skuContext;
  const outDir = createOutDir({
    targetPath: skuContext.paths.target,
    useSubfolders: distSubfolders,
  });

  if (distSubfolders) {
    // Fail fast, before anything is built or deleted.
    await assertNoPublicHtmlFiles(skuContext);

    // The Vite client build only empties `client/`, so stale output from a
    // previous build (e.g. `rendered/` or `render/`) must be cleaned explicitly.
    await ensureTargetDirectory(skuContext.paths.target);
    await cleanTargetDirectory(skuContext.paths.target);
  }

  const builder = await createBuilder(createConfig(skuContext));
  await builder.buildApp();

  if (skuContext.routes) {
    await prerenderConcurrently(skuContext);
  }
  await cleanTargetDirectory(outDir.ssg, true);
  await cleanTargetDirectory(path.join(outDir.distClient, '.vite'), true);
  await copyPublicFiles({
    paths: skuContext.paths,
    destination: outDir.distClient,
  });
};
