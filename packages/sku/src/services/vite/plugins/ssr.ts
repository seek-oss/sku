import type { Plugin } from 'vite';
import type { SkuContext } from '../../../context/createSkuContext.js';
import { makePluginName } from '../helpers/makePluginName.js';

export function ssrPlugin(_skuContext: SkuContext): Plugin {
  return {
    name: makePluginName('ssr'),
    async config() {
      return {
        server: { middlewareMode: true },
        appType: 'custom',
        environments: {
          ssr: {
            // by default, modules are run in the same process as the vite server
          },
        },
      };
    },
  };
}
