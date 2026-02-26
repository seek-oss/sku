import type { Plugin } from 'vite';
import type { SkuContext } from '../../../context/createSkuContext.js';
import { makePluginName } from '../helpers/makePluginName.js';

export function dangerouslySetViteConfigPlugin(skuContext: SkuContext): Plugin {
  return {
    name: makePluginName('dangerouslySetViteConfig'),
    config: skuContext.viteDecorator,
  };
}
