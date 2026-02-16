import { createRequire } from 'node:module';
import { type InlineConfig, mergeConfig } from 'vite';

import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import react from '@vitejs/plugin-react';

import type { SkuContext } from '../../../../context/createSkuContext.js';
import { polyfillsPlugin } from '../../plugins/polyfillsPlugin.js';
import { preloadPlugin } from '../../plugins/preloadPlugin/preloadPlugin.js';
import { fixViteVanillaExtractDepScanPlugin } from '../../plugins/esbuild/fixViteVanillaExtractDepScanPlugin.js';

import { createVocabChunks } from '@vocab/vite/chunks';
import tsconfigPaths from 'vite-tsconfig-paths';
import { getVocabConfig } from '../../../vocab/config.js';
import { vitePluginVocab } from '@vocab/vite';
import { dangerouslySetViteConfig } from '../../plugins/dangerouslySetViteConfig.js';
import { setNoExternal } from '../../plugins/setNoExternal.js';
import browserslistToEsbuild from '../browserslist-to-esbuild.js';
import { cjsInterop } from 'vite-plugin-cjs-interop';

const require = createRequire(import.meta.url);

const getBaseConfig = (skuContext: SkuContext): InlineConfig => {
  const vocabConfig = getVocabConfig(skuContext);

  const isProductionBuild = process.env.NODE_ENV === 'production';

  const prodBabelPlugins: Array<string | [string, object]> = [
    require.resolve('babel-plugin-transform-react-remove-prop-types'),
    require.resolve('@babel/plugin-transform-react-constant-elements'),
    [
      require.resolve('babel-plugin-unassert'),
      {
        variables: ['assert', 'invariant'],
        modules: ['assert', 'node:assert', 'tiny-invariant'],
      },
    ],
  ];

  if (skuContext.displayNamesProd) {
    prodBabelPlugins.push(
      require.resolve('@sku-lib/babel-plugin-display-name'),
    );
  }

  return {
    base: skuContext.publicPath,
    publicDir: false,
    root: process.cwd(),
    plugins: [
      dangerouslySetViteConfig(skuContext),
      skuContext.vitePluginsDecorator,
      vocabConfig && vitePluginVocab({ vocabConfig }),
      tsconfigPaths(),
      cjsInterop({
        dependencies: skuContext.cjsInteropDependencies,
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
      polyfillsPlugin(skuContext),
      setNoExternal(skuContext),
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
      exclude: skuContext.skipPackageCompatibilityCompilation,
    },
    ssr: {
      external: ['serialize-javascript', '@sku-lib/vite'],
    },
  };
};

const getVitestBaseConfig = (skuContext: SkuContext): InlineConfig => ({
  plugins: [
    tsconfigPaths(),
    react(),
    setNoExternal(skuContext),
    vanillaExtractPlugin(),
  ],
});

export const createSkuViteConfig = (
  config: InlineConfig,
  skuContext: SkuContext,
) => mergeConfig(getBaseConfig(skuContext), config);

export const createSkuVitestConfig = (
  config: InlineConfig,
  skuContext: SkuContext,
) => mergeConfig(getVitestBaseConfig(skuContext), config);
