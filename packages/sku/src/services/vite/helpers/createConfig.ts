import { createRequire } from 'node:module';
import type { InlineConfig } from 'vite';

import react from '@vitejs/plugin-react';
import { cjsInterop } from 'vite-plugin-cjs-interop';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

import type { SkuContext } from '@/context/createSkuContext.js';
import { preloadPlugin } from '../plugins/preloadPlugin/preloadPlugin.js';
import { fixViteVanillaExtractDepScanPlugin } from '@/services/vite/plugins/esbuild/fixViteVanillaExtractDepScanPlugin.js';
import { outDir, renderEntryChunkName } from './bundleConfig.js';
import vocabPluginVite from '@vocab/vite';
import { getVocabConfig } from '@/services/vocab/config/vocab.js';
import { createVocabChunks } from '@vocab/vite/chunks';
import tsconfigPaths from 'vite-tsconfig-paths';
import { dangerouslySetViteConfig } from '../plugins/dangerouslySetViteConfig.js';

const require = createRequire(import.meta.url);

const clientEntry = require.resolve('../entries/vite-client.js');

export const createViteConfig = ({
  skuContext,
  configType = 'client',
  plugins = [],
}: {
  skuContext: SkuContext;
  configType?: 'client' | 'ssr' | 'ssg';
  plugins?: InlineConfig['plugins'];
}): InlineConfig => {
  const input = {
    client: clientEntry,
    ssr: skuContext.paths.serverEntry,
    ssg: skuContext.paths.renderEntry,
  };
  const vocabConfig = getVocabConfig(skuContext);
  const isStartCommand = Boolean(skuContext.commandName?.startsWith('start'));

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
    base: isStartCommand ? '/' : skuContext.publicPath,
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
      ...plugins,
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
      outDir: outDir[configType],
      emptyOutDir: true,
      ssr: configType === 'ssr' || configType === 'ssg',
      manifest: configType === 'client',
      ssrManifest: false,
      assetsDir: '',
      rollupOptions: {
        input: input[configType],
        output: {
          entryFileNames:
            configType === 'ssg' ? renderEntryChunkName : undefined,
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
      external: [
        '@vanilla-extract/css/adapter',
        'serialize-javascript',
        'used-styles',
        '@sku-lib/vite',
      ],
      noExternal: [
        '@vanilla-extract/css',
        'braid-design-system',
        ...skuContext.skuConfig.compilePackages,
      ],
    },
  };
};
