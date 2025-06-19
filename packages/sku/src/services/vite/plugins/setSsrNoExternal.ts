import { type Plugin, mergeConfig } from 'vite';
import {
  extractDependencyGraph,
  getSsrExternalsForCompiledDependency,
} from '@/services/vite/helpers/config/dependencyGraph.js';
import type { SkuContext } from '@/context/createSkuContext.js';

export function setSsrNoExternal(skuContext: SkuContext): Plugin {
  return {
    name: 'vite-plugin-set-ssr-no-external',
    config: async (config) => {
      const depGraph = await extractDependencyGraph(process.cwd());
      const ssrExternals = getSsrExternalsForCompiledDependency(
        '@vanilla-extract/css',
        depGraph,
      );

      const mergedConfig = mergeConfig(config, {
        ssr: {
          noExternal: [
            ...skuContext.skuConfig.compilePackages,
            ...ssrExternals.noExternal,
          ],
        },
      });

      return mergedConfig;
    },
  };
}
