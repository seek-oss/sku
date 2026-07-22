import type { SkuContext } from '../../context/createSkuContext.js';

import { buildSsr } from './ssr/build.js';
import { startSsr } from './ssr/start.js';
import { buildStatic } from './static/build.js';
import { startStatic } from './static/start.js';

export const viteService = {
  build: async (skuContext: SkuContext) => {
    if (skuContext.buildType === 'ssr') {
      return buildSsr(skuContext);
    }

    return buildStatic(skuContext);
  },
  start: async ({
    skuContext,
    environment,
  }: {
    skuContext: SkuContext;
    environment: string;
  }) => {
    if (skuContext.buildType === 'ssr') {
      return startSsr({ skuContext, environment });
    }

    return startStatic({ skuContext, environment });
  },
};
