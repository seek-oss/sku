import type { Plugin } from 'vite';
import {
  extractDependencyGraph,
  getSsrExternalsForCompiledDependency,
} from '../helpers/config/dependencyGraph.js';
import type { SkuContext } from '../../../context/createSkuContext.js';

export function setSsrNoExternal(skuContext: SkuContext): Plugin {
  return {
    name: 'vite-plugin-set-ssr-no-external',
    async config() {
      const depGraph = await extractDependencyGraph(process.cwd());

      const ssrExternals = getSsrExternalsForCompiledDependency(
        '@vanilla-extract/css',
        depGraph,
      );

      return {
        ssr: {
          noExternal: [
            ...skuContext.skuConfig.compilePackages,
            ...ssrExternals.noExternal,
          ],
        },
      };
    },
  };
}
