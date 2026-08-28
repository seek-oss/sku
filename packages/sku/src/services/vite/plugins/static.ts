import type { PluginOption } from 'vite';
import type { SkuContext } from '../../../context/createSkuContext.js';
import { renderEntryChunkName, createOutDir } from '../helpers/bundleConfig.js';
import { makePluginName } from '../helpers/makePluginName.js';
import { vitePluginSsrCss } from './ssrCss/plugin.js';
import { middlewarePlugin } from './middleware.js';
import { telemetryPlugin } from './telemetry.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const renderEntry = require.resolve('#entries/vite-render');
const clientEntry = require.resolve('#entries/vite-client');

export const staticPlugins = ({
  skuContext,
  environment,
}: {
  skuContext: SkuContext;
  environment?: string;
}): PluginOption[] => {
  const outDir = createOutDir(skuContext.paths.target);

  return [
    {
      name: makePluginName('static'),
      config: () => ({
        optimizeDeps: {
          // Crawl all entries so they get optimized ahead of time. Reloads on
          // cold-start cause issues with Playwright tests ("REFUSED_CONNECTION").
          entries: [
            skuContext.paths.clientEntry,
            skuContext.paths.serverEntry,
            skuContext.paths.renderEntry,
            renderEntry,
            clientEntry,
          ],
        },
      }),
    },
    {
      name: makePluginName('static-build'),
      apply: 'build',
      config: () => ({
        environments: {
          client: {
            build: {
              outDir: outDir.client,
              manifest: true,
              sourcemap: skuContext.sourceMapsProd,
              rolldownOptions: {
                input: clientEntry,
              },
            },
          },
          ssr: {
            build: {
              // Sourcemaps are necessary to get useful stack traces for errors
              // thrown during prerendering
              sourcemap: 'inline',
              ssr: true,
              outDir: outDir.ssg,
              rolldownOptions: {
                input: skuContext.paths.renderEntry,
                output: {
                  entryFileNames: renderEntryChunkName,
                },
              },
            },
          },
        },
      }),
    },
    vitePluginSsrCss({
      entries: [skuContext.paths.renderEntry],
    }),
    environment !== undefined && middlewarePlugin({ skuContext, environment }),
    telemetryPlugin({
      target: 'node',
      type: 'static',
    }),
  ];
};
