import type { PluginOption } from 'vite';
import type { SkuContext } from '../../context/createSkuContext.js';
import { httpsDevServerPlugin } from './plugins/httpsDevServer.js';
import { preloadPlugin } from './plugins/preloadPlugin/preloadPlugin.js';
import { setNoExternalPlugin } from './plugins/setNoExternal.js';
import { polyfillsPlugin } from './plugins/polyfills.js';
import { dangerouslySetViteConfigPlugin } from './plugins/dangerouslySetViteConfig.js';
import { configPlugin } from './plugins/config.js';
import { buildPlugin } from './plugins/build.js';
import { devServerPlugin } from './plugins/devServer.js';
import { bundleAnalyzerPlugin } from './plugins/bundleAnalyzer.js';
import { stripServerConfigPlugin } from './plugins/stripServerConfig.js';
import { ssrPlugins } from './plugins/ssr.js';
import { staticPlugins } from './plugins/static.js';

/**
 * All sku related functionality and customization as a vite plugin.
 */
export const skuPlugin = ({
  skuContext,
  environment,
}: {
  skuContext: SkuContext;
  environment?: string;
}): PluginOption[] => {
  const isSsr = skuContext.buildType === 'ssr';

  return [
    configPlugin({ skuContext }),

    // SSR pack sits early (defines / optimizeDeps / lazy routes)
    isSsr && ssrPlugins(skuContext),

    setNoExternalPlugin(skuContext),

    buildPlugin({ skuContext }),

    devServerPlugin({ skuContext }),

    httpsDevServerPlugin(skuContext),

    !isSsr &&
      preloadPlugin({
        // Convert loadable import from webpack to vite. Can be put behind a flag.
        convertFromWebpack: skuContext.convertLoadable,
      }),

    polyfillsPlugin(skuContext),

    // Static pack sits after polyfills so middleware / telemetry / ssrCss keep
    // their previous position relative to shared serve plugins
    !isSsr && staticPlugins({ skuContext, environment }),

    bundleAnalyzerPlugin(),

    !isSsr && dangerouslySetViteConfigPlugin(skuContext),

    // `stripServerConfigPlugin` must go after `dangerouslySetViteConfigPlugin`
    stripServerConfigPlugin({
      // We can't trust vite to apply this only to its definition of `build` because the VE compiler
      // is stuck in `serve` mode due to a constraint imposed by the `createServer` API. So instead we
      // apply it based on the sku command being run.
      // See https://github.com/vitejs/vite/blob/9a0dd481ac2160078b8173879e0fa86e5e6af05d/packages/vite/src/node/server/index.ts#L501-L505.
      apply: Boolean(skuContext.commandName?.startsWith('build')),
    }),
  ];
};
