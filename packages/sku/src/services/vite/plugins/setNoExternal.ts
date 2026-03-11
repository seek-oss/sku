import type { Plugin } from 'vite';
import {
  extractDependencyGraph,
  getSsrExternalsForCompiledDependency,
} from '../helpers/config/dependencyGraph.js';
import type { SkuContext } from '../../../context/createSkuContext.js';
import { makePluginName } from '../helpers/makePluginName.js';

export function setNoExternalPlugin(skuContext: SkuContext): Plugin {
  return {
    name: makePluginName('set-no-external'),
    applyToEnvironment: (environment) => environment.name === 'ssr',
    async config() {
      const depGraph = await extractDependencyGraph(process.cwd());

      const ssrExternals = getSsrExternalsForCompiledDependency(
        '@vanilla-extract/css',
        depGraph,
      );

      return {
        resolve: {
          noExternal: [
            ...skuContext.paths.compilePackages,
            ...ssrExternals.noExternal,
          ],
        },
      };
    },
  };
}
