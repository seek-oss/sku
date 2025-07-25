import { createRequire } from 'node:module';
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
import { dangerouslySetViteConfig } from '../../plugins/dangerouslySetViteConfig.js';
import { setSsrNoExternal } from '@/services/vite/plugins/setSsrNoExternal.js';
import browserslistToEsbuild from '@/services/vite/helpers/browserslist-to-esbuild.js';
const require = createRequire(import.meta.url);

const getBaseConfig = (skuContext: SkuContext): InlineConfig => {
  const vocabConfig = getVocabConfig(skuContext);

  const isProductionBuild = process.env.NODE_ENV === 'production';
  const prodBabelPlugins = [
    [
      require.resolve('babel-plugin-unassert'),
      {
        variables: ['assert', 'invariant'],
        modules: ['assert', 'node:assert', 'tiny-invariant'],
      },
    ],
  ];

  return {
    base: skuContext.publicPath,
    root: process.cwd(),
    clearScreen: process.env.NODE_ENV !== 'test',
    plugins: [
      dangerouslySetViteConfig(skuContext),
      vocabConfig && vocabPluginVite.default({ vocabConfig }),
      tsconfigPaths(),
      cjsInterop({
        dependencies: [
          '@apollo/client',
          'lodash',
          ...skuContext.skuConfig.__UNSAFE_EXPERIMENTAL__cjsInteropDependencies,
        ],
      }),
      react({
        babel: {
          plugins: [
            require.resolve('babel-plugin-macros'),
            ...(isProductionBuild ? prodBabelPlugins : []),
          ],
        },
      }),
      vanillaExtractPlugin(),
      preloadPlugin({
        convertFromWebpack: skuContext.convertLoadable, // Convert loadable import from webpack to vite. Can be put behind a flag.
      }),
      setSsrNoExternal(skuContext),
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
      target: browserslistToEsbuild(skuContext.supportedBrowsers),
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
      exclude: skuContext.skuConfig.skipPackageCompatibilityCompilation,
    },
    ssr: {
      external: ['serialize-javascript', '@sku-lib/vite'],
    },
  };
};

export const createSkuViteConfig = (
  config: InlineConfig,
  skuContext: SkuContext,
) => mergeConfig(getBaseConfig(skuContext), config);
