import type { SkuContext } from '@/context/createSkuContext.js';
import react from '@vitejs/plugin-react';
import type { InlineConfig } from 'vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { cssFileFilter } from '@vanilla-extract/integration';
import resolveFrom from 'resolve-from';
import type { Plugin } from 'esbuild';
import { dirname } from 'path';

import preloadPlugin from './preload/plugin.js';

export const fixViteVanillaExtractDepScanPlugin = (): Plugin => ({
  name: 'fix-vite-vanilla-extract-dep-scan',
  setup(build) {
    build.onResolve({ filter: cssFileFilter }, async ({ importer, path }) => ({
      path: resolveFrom(dirname(importer), path),
      external: true,
    }));
  },
});

export const createViteConfig = ({
  skuContext,
  configType = 'client',
  plugins = [],
}: {
  skuContext: SkuContext;
  configType?: 'client' | 'ssr' | 'ssg';
  plugins?: InlineConfig['plugins'];
}) => {
  const outDir = {
    client: 'dist',
    ssr: 'dist/server',
    ssg: 'dist/render',
  };

  return {
    root: process.cwd(),
    plugins: [
      react(),
      vanillaExtractPlugin({
        // @ts-ignore
        pluginFilter: (plugin) => !plugin.name.startsWith('vite:react-'),
      }),
      preloadPlugin(),
      ...plugins,
    ],
    resolve: {
      alias: {
        __sku_alias__clientEntry: skuContext.paths.clientEntry,
        __sku_alias__serverEntry: skuContext.paths.serverEntry,
      },
    },
    define: {
      VITE_SKU_CONTEXT: JSON.stringify(skuContext),
      'process.env': process.env,
    },
    build: {
      outDir: outDir[configType],
      emptyOutDir: true,
      ssr: configType === 'ssr' || configType === 'ssg',
      manifest: configType === 'client',
      ssrManifest: false,
      rollupOptions: {
        ...(configType === 'ssr'
          ? { input: skuContext.paths.serverEntry }
          : {}),
        ...(configType === 'ssg'
          ? {
              input: skuContext.paths.renderEntry,
            }
          : {}),
        output: {
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
      noExternal: ['@vanilla-extract/css', 'braid-design-system'],
    },
  } satisfies InlineConfig;
};
