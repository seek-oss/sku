import type { PluginOption } from 'vite';
import type { SkuContext } from '../../../context/createSkuContext.js';
import { createOutDir } from '../helpers/bundleConfig.js';
import { makePluginName } from '../helpers/makePluginName.js';
import { CLIENT_MANIFEST_RELATIVE_PATH } from '../ssr/clientManifestPath.js';
import { SSR_CLIENT_CHUNK_NAME } from '../ssr/resolveAssets.js';
import { resolveConfigSiteNames } from '../ssr/resolveConfigSiteNames.js';
import { lazyRouteModuleIdPlugin } from './lazyRouteModuleId/lazyRouteModuleIdPlugin.js';
import { ENTRY_SIDE_EFFECTS_VIRTUAL_ID } from './entrySideEffects.js';
import { vitePluginSsrCss } from './ssrCss/plugin.js';
import { telemetryPlugin } from './telemetry.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const ssrClientEntry = require.resolve('#entries/ssr-client');
const ssrClientDevEntry = require.resolve('#entries/ssr-client.dev');
const ssrServerEntry = require.resolve('#entries/ssr-server');

export const ssrPlugins = (skuContext: SkuContext): PluginOption[] => {
  const outDir = createOutDir({
    targetPath: skuContext.paths.target,
    useSubfolders: true,
  });
  const siteNames = resolveConfigSiteNames(skuContext.sites);

  return [
    {
      name: makePluginName('ssr'),
      config: () => ({
        // Bake for start + build so server/client pre-build identical site trees.
        define: {
          __SKU_SITES__: JSON.stringify(siteNames),
        },
        optimizeDeps: {
          // Crawl all entries so they get optimized ahead of time. Reloads on
          // cold-start cause issues with Playwright tests ("REFUSED_CONNECTION").
          entries: [
            skuContext.paths.serverEntry,
            skuContext.paths.clientEntry,
            skuContext.paths.routesEntry,
            ssrClientDevEntry,
            ssrClientEntry,
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
            reportTo: skuContext.cspReportTo,
            reportOnlyEnabled: skuContext.cspReportOnlyEnabled,
            reportOnlyExtraHosts: skuContext.cspReportOnlyExtraScriptSrcHosts,
            reportOnlyReportTo: skuContext.cspReportOnlyReportTo,
          }),
          __SKU_EXPRESS_TRUST_PROXY__: JSON.stringify(
            Boolean(skuContext.expressTrustProxy),
          ),
        },
        environments: {
          client: {
            build: {
              outDir: outDir.distClient,
              manifest: CLIENT_MANIFEST_RELATIVE_PATH,
              sourcemap: skuContext.sourceMapsProd,
              rolldownOptions: {
                input: { [SSR_CLIENT_CHUNK_NAME]: ssrClientEntry },
              },
            },
          },
          ssr: {
            resolve: {
              // The production server must run without the app's node_modules
              noExternal: true,
              // Bundling resolves from each importer, so sku's runtime could
              // otherwise bundle a second copy of these singletons
              dedupe: ['react', 'react-dom', 'react-router'],
            },
            build: {
              // Sourcemaps are necessary to get useful stack traces for errors
              sourcemap: 'inline',
              ssr: true,
              outDir: outDir.distServer,
              rolldownOptions: {
                input: ssrServerEntry,
                // `.mjs` so Node loads the server as ESM regardless of any
                // `package.json` "type" above wherever it is deployed
                output: {
                  entryFileNames: 'server.mjs',
                  chunkFileNames: '[name]-[hash].chunk.mjs',
                },
              },
            },
          },
        },
      }),
      configEnvironment(name, config) {
        if (name === 'ssr' && config.resolve) {
          // Drop every explicit SSR external so the server bundle is
          // self-contained. Explicit externals take precedence over
          // `noExternal: true`, and plugins add them in their `config` hooks
          // (e.g. vanilla-extract adds `@vanilla-extract/css` to
          // `ssr.external`). Config merging concatenates arrays, so they can
          // only be removed here, after every `config` hook has run. This
          // plugin is build-only, so `sku start` keeps those externals.
          config.resolve.external = [];
        }
      },
    },
    lazyRouteModuleIdPlugin(),
    // Serve-only: sku-hoisted `assets.css` + client entry own injection.
    vitePluginSsrCss({
      entries: [
        ENTRY_SIDE_EFFECTS_VIRTUAL_ID,
        skuContext.paths.serverEntry,
        skuContext.paths.routesEntry,
        ssrServerEntry,
      ],
      injectHtml: false,
    }),
    telemetryPlugin({
      target: 'node',
      type: 'ssr',
      injectHtml: false,
    }),
  ];
};
