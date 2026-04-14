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
            manifest: true,
            sourcemap: skuContext.sourceMapsProd,
            rolldownOptions: {
              // this should be skuContext.paths.clientEntry in sku start-ssr or build-ssr mode
              input: clientEntry,
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
              },
            },
          },
        },
      },
    }),
  };
};
