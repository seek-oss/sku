import type { PluginOption } from 'vite';
import type { SkuContext } from '../../../context/createSkuContext.js';
import { renderEntryChunkName, createOutDir } from '../helpers/bundleConfig.js';
import { createVocabChunks } from '@vocab/vite/chunks';
import browserslistToEsbuild from '../helpers/browserslist-to-esbuild.js';
import { makePluginName } from '../helpers/makePluginName.js';
import { assetsInlineLimitBytes } from '../../bundlerConstants.js';

const clientEntry = require.resolve('#entries/vite-client');

export const buildPlugin = ({
  skuContext,
}: {
  skuContext: SkuContext;
}): PluginOption => {
  const outDir = createOutDir(skuContext.paths.target);

  // ssr and client environments must share the same asset and chunk names to ensure files emitted
  // during the client build match asset and chunk names reference by static HTML
  const sharedOutputFileNames = {
    chunkFileNames: '[name]-[hash].chunk.js',
    assetFileNames: '[name]-[hash][extname]',
  };

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
            codeSplitting: {
              groups: [
                {
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
            outDir: outDir.client,
            // The render bundle is emitted to a subdirectory of the client outDir, so we
            // manually clean the target directory at the vite service layer and disable vite's
            // automatic cleanup of the `outDir`. This ensures cleanup is not dependent on which
            // environment's build runs first.
            emptyOutDir: false,
            manifest: true,
            sourcemap: skuContext.sourceMapsProd,
            rolldownOptions: {
              // this should be skuContext.paths.clientEntry in sku start-ssr or build-ssr mode
              input: clientEntry,
              output: {
                entryFileNames: '[name]-[hash].js',
                ...sharedOutputFileNames,
              },
            },
          },
        },
        ssr: {
          build: {
            // Sourcemaps are necessary to get useful stack traces for errors thrown during prerendering
            sourcemap: 'inline',
            ssr: true,
            outDir: outDir.ssg,
            rolldownOptions: {
              // this should be skuContext.paths.serverEntry in sku start-ssr or build-ssr mode
              input: skuContext.paths.renderEntry,
              output: {
                entryFileNames: renderEntryChunkName,
                ...sharedOutputFileNames,
              },
            },
          },
        },
      },
    }),
  };
};
