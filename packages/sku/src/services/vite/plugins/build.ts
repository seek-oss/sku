import type { PluginOption } from 'vite';
import type { SkuContext } from '../../../context/createSkuContext.js';
import { createVocabChunks } from '@vocab/vite/chunks';
import browserslistToEsbuild from '../helpers/browserslist-to-esbuild.js';
import { makePluginName } from '../helpers/makePluginName.js';
import { assetsInlineLimitBytes } from '../../bundlerConstants.js';

export const buildPlugin = ({
  skuContext,
}: {
  skuContext: SkuContext;
}): PluginOption => ({
  name: makePluginName('build'),
  apply: 'build',
  config: () => ({
    // Build only: emit / resolve asset URLs under `publicPath`.
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
                // Vocab language chunks (`en-translations`, …)
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
  }),
});
