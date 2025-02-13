import { builtinModules } from 'node:module';
import type { InlineConfig } from 'vite';

import react from '@vitejs/plugin-react';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

import type { SkuContext } from '@/context/createSkuContext.js';

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
        unstable_pluginFilter: (plugin) =>
          !plugin.name.startsWith('vite:react-'),
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
      include: ['react-dom'],
    },
    ssr: {
      external: [
        ...builtinModules,
        '@vanilla-extract/css/adapter',
        'serialize-javascript',
        'used-styles',
      ],
      noExternal: ['@vanilla-extract/css', 'braid-design-system'],
    },
  } satisfies InlineConfig;
};
