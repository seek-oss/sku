import { createRequire } from 'node:module';
import type { InlineConfig } from 'vite';

import react from '@vitejs/plugin-react';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

import type { SkuContext } from '@/context/createSkuContext.js';
import { skuGenerateIndexPlugin } from '@/services/vite/plugins/skuGenerateIndexPlugin.js';
import { fixViteVanillaExtractDepScanPlugin } from '@/services/vite/plugins/esbuild/fixViteVanillaExtractDepScanPlugin.js';

import skuVitePreloadPlugin from './plugins/skuVitePreloadPlugin.js';

const require = createRequire(import.meta.url);

const entry = require.resolve('./entries/vite-client.jsx');

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
      skuGenerateIndexPlugin(),
      react(),
      vanillaExtractPlugin({
        // @ts-ignore
        pluginFilter: (plugin) => !plugin.name.startsWith('vite:react-'),
      }),
      skuVitePreloadPlugin(),
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
        ...(configType === 'client' ? { input: entry } : {}),
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
