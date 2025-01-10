import type { SkuContext } from '@/context/createSkuContext.js';
import react from '@vitejs/plugin-react';
import type { InlineConfig } from 'vite';
import preloadPlugin from 'vite-preload/plugin';
import legacy from '@vitejs/plugin-legacy';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { cssFileFilter } from '@vanilla-extract/integration';
import resolveFrom from 'resolve-from';
import type { Plugin } from 'esbuild';
import { dirname } from 'path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = dirname(__filename);

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
      vanillaExtractPlugin(),
      react(),
      preloadPlugin({
        __internal_importHelperModuleName: 'sku/vite-preload/__internal',
      }),
      legacy({
        modernPolyfills: true,
        renderLegacyChunks: false,
      }),
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
    html: {
      cspNonce: '%NONCE%',
    },
  } satisfies InlineConfig;
};
