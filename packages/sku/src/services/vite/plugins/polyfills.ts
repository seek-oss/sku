import type { Plugin } from 'vite';
import { exactRegex } from 'rolldown/filter';

import type { SkuContext } from '../../../context/createSkuContext.js';
import { resolvePolyfills } from '../../../utils/resolvePolyfills.js';
import { makePluginName } from '../helpers/makePluginName.js';

export const polyfillsPlugin = (skuContext: SkuContext): Plugin => {
  const virtualModuleId = 'virtual:sku/polyfills';
  const resolvedVirtualModuleId = `\0${virtualModuleId}`;
  const resolvedPolyfills = resolvePolyfills(skuContext.polyfills);

  return {
    name: makePluginName('polyfills'),
    resolveId: {
      filter: { id: exactRegex(virtualModuleId) },
      handler() {
        return resolvedVirtualModuleId;
      },
    },
    load: {
      filter: { id: exactRegex(resolvedVirtualModuleId) },
      handler() {
        return resolvedPolyfills
          .map((polyfillPath) => `import '${polyfillPath}';`)
          .join('\n');
      },
    },
  };
};
