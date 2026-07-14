import type { PluginOption } from 'vite';
import type { SkuContext } from '../../../context/createSkuContext.js';
import { fixViteVanillaExtractDepScanPlugin } from './esbuild/fixViteVanillaExtractDepScanPlugin.js';
import { makePluginName } from '../helpers/makePluginName.js';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const renderEntry = require.resolve('#entries/vite-render');
const clientEntry = require.resolve('#entries/vite-client');
const ssrClientEntry = require.resolve('#entries/vite-ssr-client');
const ssrServerEntry = require.resolve('#entries/vite-ssr-server');

export const configPlugin = ({
  skuContext,
}: {
  skuContext: SkuContext;
}): PluginOption => {
  const isViteSsr =
    skuContext.bundler === 'vite' &&
    skuContext.renderType === 'server-side-rendered';

  const viteSsrOptimizeEntries = [
    skuContext.paths.routesEntry,
    ssrClientEntry,
    ssrServerEntry,
    ...(existsSync(skuContext.paths.serverEntry)
      ? [skuContext.paths.serverEntry]
      : []),
    ...(existsSync(skuContext.paths.clientEntry)
      ? [skuContext.paths.clientEntry]
      : []),
  ];

  return {
    name: makePluginName('config'),
    config: () => ({
      publicDir: skuContext.paths.public,
      root: process.cwd(),
      resolve: {
        alias: {
          __sku_alias__clientEntry: skuContext.paths.clientEntry,
          __sku_alias__serverEntry: skuContext.paths.serverEntry,
          __sku_alias__renderEntry: skuContext.paths.renderEntry,
        },
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      },
      optimizeDeps: {
        // crawl all the entries to  ensure they get optimized ahead of time. This helps prevent reloads on cold-start.
        // Reloads on cold-start cause issues with our Playwright tests, so we need to ensure they get optimized ahead of time.
        // If you see "REFUSED_CONNECTION" errors in Playwright tests it may be because entries are missing from here.
        entries: isViteSsr
          ? viteSsrOptimizeEntries
          : [
              skuContext.paths.clientEntry,
              skuContext.paths.serverEntry,
              skuContext.paths.renderEntry,
              renderEntry,
              clientEntry,
            ],
        rolldownOptions: {
          plugins: [fixViteVanillaExtractDepScanPlugin()],
        },
        exclude: skuContext.skipPackageCompatibilityCompilation,
      },
      ssr: {
        external: [
          'serialize-javascript',
          '@sku-lib/vite',
          ...(isViteSsr ? ['vite'] : []),
        ],
      },
    }),
  };
};
