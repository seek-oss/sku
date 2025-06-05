import { createSkuViteConfig } from '@/services/vite/helpers/config/baseConfig.js';
import type { SkuContext } from '@/context/createSkuContext.js';
import {
  outDir,
  renderEntryChunkName,
} from '@/services/vite/helpers/bundleConfig.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const clientEntry = require.resolve('../../entries/vite-client.js');

export const createViteSsgConfig = (skuContext: SkuContext) =>
  createSkuViteConfig(
    {
      build: {
        ssr: true,
        outDir: outDir.ssg,
        rollupOptions: {
          input: skuContext.paths.renderEntry,
          output: {
            entryFileNames: renderEntryChunkName,
          },
        },
      },
    },
    skuContext,
  );

export const createViteClientConfig = (skuContext: SkuContext) =>
  createSkuViteConfig(
    {
      build: {
        ssr: false,
        outDir: outDir.client,
        manifest: true,
        rollupOptions: {
          input: clientEntry,
        },
      },
    },
    skuContext,
  );

export const createViteSsrConfig = (skuContext: SkuContext) =>
  createSkuViteConfig(
    {
      build: {
        ssr: true,
        outDir: outDir.ssr,
        rollupOptions: {
          input: skuContext.paths.serverEntry,
        },
      },
    },
    skuContext,
  );
