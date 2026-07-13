import type { PluginOption } from 'vite';
import type { SkuContext } from '../../../context/createSkuContext.js';
import { renderEntryChunkName, createOutDir } from '../helpers/bundleConfig.js';
import { createVocabChunks } from '@vocab/vite/chunks';
import browserslistToEsbuild from '../helpers/browserslist-to-esbuild.js';
import { makePluginName } from '../helpers/makePluginName.js';
import { assetsInlineLimitBytes } from '../../bundlerConstants.js';

const clientEntry = require.resolve('#entries/vite-client');
const ssrClientEntry = require.resolve('#entries/vite-ssr-client');
const ssrServerEntry = require.resolve('#entries/vite-ssr-server');

export const buildPlugin = ({
  skuContext,
}: {
  skuContext: SkuContext;
}): PluginOption => {
  const outDir = createOutDir(skuContext.paths.target);
  const isViteSsr =
    skuContext.bundler === 'vite' &&
    skuContext.renderType === 'server-side-rendered';

  return {
    name: makePluginName('build'),
    apply: 'build',
    config: () => ({
      // these are inherited by each environment
      base: skuContext.publicPath,
      build: {
        target: browserslistToEsbuild(skuContext.supportedBrowsers),
        assetsDir: '',
        assetsInlineLimit: assetsInlineLimitBytes,
        rolldownOptions: {
          output: {
            entryFileNames: '[name]-[hash].js',
            chunkFileNames: '[name]-[hash].chunk.js',
            assetFileNames: '[name]-[hash][extname]',
            codeSplitting: {
              groups: [
                {
                  // Vocab language chunks (`en-translations`, …) for static and Vite SSR builds
                  name: (id, ctx) => {
                    const languageChunkName = createVocabChunks(id, ctx);
                    if (languageChunkName) {
                      return languageChunkName;
                    }
                    return null;
                  },
                },
              ],
            },
          },
        },
      },
      environments: {
        client: {
          build: {
            outDir: isViteSsr ? outDir.ssrClient : outDir.client,
            manifest: true,
            sourcemap: skuContext.sourceMapsProd,
            rolldownOptions: {
              // this should be skuContext.paths.clientEntry in sku start-ssr or build-ssr mode
              input: isViteSsr ? ssrClientEntry : clientEntry,
            },
          },
        },
        ssr: {
          build: {
            // Sourcemaps are necessary to get useful stack traces for errors thrown during prerendering
            sourcemap: 'inline',
            ssr: true,
            outDir: isViteSsr ? outDir.ssr : outDir.ssg,
            rolldownOptions: {
              // this should be skuContext.paths.serverEntry in sku start-ssr or build-ssr mode
              input: isViteSsr ? ssrServerEntry : skuContext.paths.renderEntry,
              output: {
                entryFileNames: isViteSsr ? 'server.js' : renderEntryChunkName,
              },
            },
          },
        },
      },
    }),
  };
};
