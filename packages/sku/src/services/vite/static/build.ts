import { createBuilder } from 'vite';

import type { SkuContext } from '../../../context/createSkuContext.js';
import {
  cleanTargetDirectory,
  copyPublicFiles,
} from '../../../utils/buildFileUtils.js';
import { createOutDir } from '../helpers/bundleConfig.js';
import { createConfig } from '../helpers/config/createConfig.js';
import { prerenderConcurrently } from '../helpers/prerender/prerenderConcurrently.js';

export const buildStatic = async (skuContext: SkuContext) => {
  const outDir = createOutDir(skuContext.paths.target);

  const builder = await createBuilder(createConfig(skuContext));
  await builder.buildApp();

  if (skuContext.routes) {
    await prerenderConcurrently(skuContext);
  }
  await cleanTargetDirectory(outDir.ssg, true);
  await cleanTargetDirectory(outDir.join('.vite'), true);
  await copyPublicFiles(skuContext);
};
