import type { Plugin } from 'vite';

import type { SkuContext } from '#src/context/createSkuContext.js';
import { resolvePolyfills } from '#src/utils/resolvePolyfills.js';

export const polyfillsPlugin = (skuContext: SkuContext): Plugin => {
  const virtualModuleId = 'virtual:sku/polyfills';
  const resolvedVirtualModuleId = `\0${virtualModuleId}`;
  const resolvedPolyfills = resolvePolyfills(skuContext.polyfills);

  return {
    name: 'vite-plugin-sku-polyfills',
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return resolvedPolyfills
          .map((polyfillPath) => `import '${polyfillPath}';`)
          .join('\n');
      }
    },
  };
};
