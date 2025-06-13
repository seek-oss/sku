import { createSkuViteConfig } from '@/services/vite/helpers/config/baseConfig.js';
import type { SkuContext } from '@/context/createSkuContext.js';
import {
  outDir,
  renderEntryChunkName,
} from '@/services/vite/helpers/bundleConfig.js';
import { createRequire } from 'node:module';
import { middlewarePlugin } from '@/services/vite/plugins/middlewarePlugin.js';
import { startTelemetryPlugin } from '@/services/vite/plugins/startTelemetry.js';
import { HMRTelemetryPlugin } from '@/services/vite/plugins/HMRTelemetry.js';
import { httpsDevServerPlugin } from '@/services/vite/plugins/httpsDevServerPlugin.js';
import { getAppHosts } from '@/utils/contextUtils/hosts.js';

const require = createRequire(import.meta.url);

const clientEntry = require.resolve('../../entries/vite-client.js');

export const createViteSsgConfig = async (skuContext: SkuContext) =>
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

export const createViteSsrConfig = async (skuContext: SkuContext) =>
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

export const createViteClientConfig = async (skuContext: SkuContext) =>
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

export const createViteDevConfig = async (skuContext: SkuContext) =>
  createSkuViteConfig(
    {
      base: '/',
      plugins: [
        middlewarePlugin(skuContext),
        startTelemetryPlugin({
          target: 'node',
          type: 'static',
        }),
        // eslint-disable-next-line new-cap
        HMRTelemetryPlugin({
          target: 'node',
          type: 'static',
        }),
        httpsDevServerPlugin(skuContext),
      ],
      build: {
        ssr: false,
        outDir: outDir.client,
        manifest: true,
        rollupOptions: {
          input: clientEntry,
        },
      },
      server: {
        host: 'localhost',
        allowedHosts: getAppHosts(skuContext).filter(
          (host) => typeof host === 'string',
        ),
      },
    },
    skuContext,
  );

export const createViteDevSsrConfig = async (skuContext: SkuContext) =>
  createSkuViteConfig(
    {
      build: {
        ssr: true,
        outDir: outDir.ssr,
        rollupOptions: {
          input: skuContext.paths.serverEntry,
        },
      },
      server: {
        host: 'localhost',
        middlewareMode: true,
        hmr: true,
        allowedHosts: getAppHosts(skuContext).filter(
          (host) => typeof host === 'string',
        ),
      },
      plugins: [httpsDevServerPlugin(skuContext)],
      appType: 'custom',
      base: '/',
    },
    skuContext,
  );
