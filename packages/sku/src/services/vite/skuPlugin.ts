import type { PluginOption } from 'vite';
import type { SkuContext } from '../../context/createSkuContext.js';
import { httpsDevServerPlugin } from './plugins/httpsDevServer.js';
import { middlewarePlugin } from './plugins/middleware.js';
import { vitePluginSsrCss } from './plugins/ssrCss/plugin.js';
import { preloadPlugin } from './plugins/preloadPlugin/preloadPlugin.js';
import { setNoExternalPlugin } from './plugins/setNoExternal.js';
import { polyfillsPlugin } from './plugins/polyfills.js';
import { dangerouslySetViteConfigPlugin } from './plugins/dangerouslySetViteConfig.js';
import { telemetryPlugin } from './plugins/telemetry.js';
import { configPlugin } from './plugins/config.js';
import { buildPlugin } from './plugins/build.js';
import { devServerPlugin } from './plugins/devServer.js';

/**
 * All sku related functionality and customization as a vite plugin.
 */
export const skuPlugin = ({
  skuContext,
  environment,
}: {
  skuContext: SkuContext;
  environment?: string;
}): PluginOption[] => [
  // shared
  configPlugin({ skuContext }),
  buildPlugin({ skuContext }),
  devServerPlugin({ skuContext }),
  dangerouslySetViteConfigPlugin(skuContext),
  preloadPlugin({
    convertFromWebpack: skuContext.convertLoadable, // Convert loadable import from webpack to vite. Can be put behind a flag.
  }),
  polyfillsPlugin(skuContext),
  setNoExternalPlugin(skuContext),
  // start
  vitePluginSsrCss({
    entries: [skuContext.paths.renderEntry],
  }),
  environment !== undefined && middlewarePlugin({ skuContext, environment }),
  telemetryPlugin({
    target: 'node',
    type: 'static',
  }),
  httpsDevServerPlugin(skuContext),
];
