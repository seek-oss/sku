import { createBuilder } from 'vite';

import type { SkuContext } from '../../../context/createSkuContext.js';
import { cleanTargetDirectory } from '../../../utils/buildFileUtils.js';
import exists from '../../../utils/exists.js';
import { createConfig } from '../helpers/config/createConfig.js';

export const buildSsr = async (skuContext: SkuContext) => {
  if (await exists(skuContext.paths.target)) {
    await cleanTargetDirectory(skuContext.paths.target);
  }

  const builder = await createBuilder(createConfig(skuContext));
  await builder.buildApp();
};
