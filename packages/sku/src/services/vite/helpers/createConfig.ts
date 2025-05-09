import { createRequire, builtinModules } from 'node:module';
import type { InlineConfig } from 'vite';

import react from '@vitejs/plugin-react-swc';
import { cjsInterop } from 'vite-plugin-cjs-interop';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

import type { SkuContext } from '@/context/createSkuContext.js';
import skuVitePreloadPlugin from '../plugins/skuVitePreloadPlugin/skuVitePreloadPlugin.js';
import { fixViteVanillaExtractDepScanPlugin } from '@/services/vite/plugins/esbuild/fixViteVanillaExtractDepScanPlugin.js';
import { outDir, renderEntryChunkName } from './bundleConfig.js';
import tsconfigPaths from 'vite-tsconfig-paths';

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
}) => {
  const input = {
    client: clientEntry,
    ssr: skuContext.paths.serverEntry,
    ssg: skuContext.paths.renderEntry,
  };

  return {
    root: process.cwd(),
    clearScreen: process.env.NODE_ENV !== 'test',
    plugins: [
      tsconfigPaths(),
      cjsInterop({
        dependencies: ['@apollo/client', 'lodash'],
      }),
      react(),
      vanillaExtractPlugin(),
      skuVitePreloadPlugin({
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
        ...(configType === 'ssg' || configType === 'ssr'
          ? ['sku/vite/loadable']
          : []),
      ],
      noExternal: ['@vanilla-extract/css', 'braid-design-system'],
    },
  } satisfies InlineConfig;
};
