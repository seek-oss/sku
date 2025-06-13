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
import {
  extractDependencyGraph,
  getSsrExternalsForCompiledDependency,
} from '@/services/vite/helpers/config/dependencyGraph.js';

const require = createRequire(import.meta.url);

const getBaseConfig = async (skuContext: SkuContext): Promise<InlineConfig> => {
  const vocabConfig = getVocabConfig(skuContext);

  const depGraph = await extractDependencyGraph(process.cwd());
  const ssrExternals = getSsrExternalsForCompiledDependency(
    '@vanilla-extract/css',
    depGraph,
  );

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
        dependencies: ['@apollo/client', 'lodash'],
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
      exclude: skuContext.skuConfig.skipPackageCompatibilityCompilation,
    },
    ssr: {
      external: ['serialize-javascript', '@sku-lib/vite'],
      noExternal: [
        ...ssrExternals.noExternal,
        ...skuContext.skuConfig.compilePackages,
      ],
    },
  };
};

export const createSkuViteConfig = async (
  config: InlineConfig,
  skuContext: SkuContext,
) => mergeConfig(await getBaseConfig(skuContext), config);
