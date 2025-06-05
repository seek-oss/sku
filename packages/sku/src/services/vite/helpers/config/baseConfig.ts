import { builtinModules, createRequire } from 'node:module';
import { type InlineConfig, mergeConfig } from 'vite';

import { cjsInterop } from 'vite-plugin-cjs-interop';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import react from '@vitejs/plugin-react';

import type { SkuContext } from '@/context/createSkuContext.js';
import { preloadPlugin } from '../../plugins/preloadPlugin/preloadPlugin.js';
import { fixViteVanillaExtractDepScanPlugin } from '@/services/vite/plugins/esbuild/fixViteVanillaExtractDepScanPlugin.js';

import { createVocabChunks } from '@vocab/vite/chunks';
import tsconfigPaths from 'vite-tsconfig-paths';
import { getVocabConfig } from '@/services/vocab/config/vocab.js';
import vocabPluginVite from '@vocab/vite';

const require = createRequire(import.meta.url);

const getBaseConfig = (skuContext: SkuContext): InlineConfig => {
  const vocabConfig = getVocabConfig(skuContext);
  return {
    base: skuContext.publicPath,
    root: process.cwd(),
    clearScreen: process.env.NODE_ENV !== 'test',
    plugins: [
      vocabConfig && vocabPluginVite.default({ vocabConfig }),
      tsconfigPaths(),
      cjsInterop({
        dependencies: ['@apollo/client', 'lodash'],
      }),
      react({
        babel: {
          plugins: [
            ...(process.env.NODE_ENV === 'production'
              ? [
                  [
                    require.resolve('babel-plugin-unassert'),
                    {
                      variables: ['assert', 'invariant'],
                      modules: ['assert', 'node:assert', 'tiny-invariant'],
                    },
                  ],
                ]
              : []),
          ],
        },
      }),
      vanillaExtractPlugin(),
      preloadPlugin({
        convertFromWebpack: skuContext.convertLoadable, // Convert loadable import from webpack to vite. Can be put behind a flag.
      }),
    ],
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
    build: {
      emptyOutDir: true,
      ssrManifest: false,
      assetsDir: '',
      rollupOptions: {
        output: {
          experimentalMinChunkSize: undefined,
          manualChunks: (id, ctx) => {
            const languageChunkName = createVocabChunks(id, ctx);
            if (languageChunkName) {
              return languageChunkName;
            }
          },
        },
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        plugins: [fixViteVanillaExtractDepScanPlugin()],
      },
    },
    ssr: {
      external: [
        ...builtinModules,
        '@vanilla-extract/css/adapter',
        'serialize-javascript',
        'used-styles',
        '@sku-lib/vite',
      ],
      noExternal: ['@vanilla-extract/css', 'braid-design-system'],
    },
  };
};

export const createSkuViteConfig = (
  config: InlineConfig,
  skuContext: SkuContext,
) => mergeConfig(getBaseConfig(skuContext), config, false);
