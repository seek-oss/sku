import type { Plugin } from 'vite';
import type { SkuContext } from '../../../context/createSkuContext.js';

export function dangerouslySetViteConfig(skuContext: SkuContext): Plugin {
  return {
    name: 'vite-plugin-dangerously-set-config',
    config:
      skuContext.skuConfig.__UNSAFE_EXPERIMENTAL__dangerouslySetViteConfig,
  };
}
