import type { PluginOption } from 'vite';
import type { SkuContext } from '../../../context/createSkuContext.js';
import { createOutDir } from '../helpers/bundleConfig.js';
import { makePluginName } from '../helpers/makePluginName.js';
import { lazyRouteModuleIdPlugin } from './lazyRouteModuleId/lazyRouteModuleIdPlugin.js';
import { vitePluginSsrCss } from './ssrCss/plugin.js';
import { telemetryPlugin } from './telemetry.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const ssrClientEntry = require.resolve('#entries/vite-ssr-client');
const ssrClientDevEntry = require.resolve('#entries/vite-ssr-client.dev');
const ssrServerEntry = require.resolve('#entries/vite-ssr-server');

export const ssrPlugins = (skuContext: SkuContext): PluginOption[] => {
  const outDir = createOutDir(skuContext.paths.target);

  return [
    {
      name: makePluginName('ssr'),
      config: () => ({
        optimizeDeps: {
          // Crawl all entries so they get optimized ahead of time. Reloads on
          // cold-start cause issues with Playwright tests ("REFUSED_CONNECTION").
          entries: [
            skuContext.paths.serverEntry,
            skuContext.paths.clientEntry,
            ssrClientDevEntry,
            ssrServerEntry,
          ],
        },
        ssr: {
          external: ['vite'],
        },
      }),
    },
    {
      name: makePluginName('ssr-build'),
      apply: 'build',
      config: () => ({
        define: {
          __SKU_DEFAULT_SERVER_PORT__: JSON.stringify(
            String(skuContext.port.client),
          ),
          __SKU_PUBLIC_PATH__: JSON.stringify(skuContext.publicPath),
          __SKU_CSP__: JSON.stringify({
            enabled: skuContext.cspEnabled,
            extraHosts: skuContext.cspExtraScriptSrcHosts,
            reportOnlyEnabled: skuContext.cspReportOnlyEnabled,
            reportOnlyExtraHosts: skuContext.cspReportOnlyExtraScriptSrcHosts,
            reportOnlyReportTo: skuContext.cspReportOnlyReportTo,
          }),
        },
        environments: {
          client: {
            build: {
              outDir: outDir.ssrClient,
              manifest: true,
              sourcemap: skuContext.sourceMapsProd,
              rolldownOptions: {
                input: ssrClientEntry,
              },
            },
          },
          ssr: {
            build: {
              // Sourcemaps are necessary to get useful stack traces for errors
              sourcemap: 'inline',
              ssr: true,
              outDir: outDir.ssr,
              rolldownOptions: {
                input: ssrServerEntry,
                output: {
                  entryFileNames: 'server.js',
                },
              },
            },
          },
        },
      }),
    },
    lazyRouteModuleIdPlugin(),
    // Serve-only: Document `assets.css` + client entry own injection.
    vitePluginSsrCss({
      entries: [skuContext.paths.serverEntry, ssrServerEntry],
      injectHtml: false,
    }),
    telemetryPlugin({
      target: 'node',
      type: 'ssr',
      injectHtml: false,
    }),
  ];
};
