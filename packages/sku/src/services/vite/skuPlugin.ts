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
import { bundleAnalyzerPlugin } from './plugins/bundleAnalyzer.js';
import { stripServerConfigPlugin } from './plugins/stripServerConfig.js';
import { ssrPlugin } from './plugins/ssr.js';
import { lazyRouteModuleIdPlugin } from './plugins/lazyRouteModuleId/lazyRouteModuleIdPlugin.js';

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
  const isViteSsr =
    skuContext.bundler === 'vite' &&
    skuContext.renderType === 'server-side-rendered';

  return [
    configPlugin({ skuContext }),
    isViteSsr && ssrPlugin(skuContext),
    isViteSsr && lazyRouteModuleIdPlugin(),
    setNoExternalPlugin(skuContext),
    buildPlugin({ skuContext }),
    devServerPlugin({ skuContext }),
    httpsDevServerPlugin(skuContext),
    preloadPlugin({
      // Convert loadable import from webpack to vite. Can be put behind a flag.
      convertFromWebpack: skuContext.convertLoadable,
    }),
    polyfillsPlugin(skuContext),
    !isViteSsr &&
      vitePluginSsrCss({
        entries: [skuContext.paths.renderEntry],
      }),
    !isViteSsr &&
      environment !== undefined &&
      middlewarePlugin({ skuContext, environment }),
    !isViteSsr &&
      telemetryPlugin({
        target: 'node',
        type: 'static',
      }),
    bundleAnalyzerPlugin(),
    dangerouslySetViteConfigPlugin(skuContext),
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
