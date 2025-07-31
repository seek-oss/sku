import { createSkuViteConfig } from '#src/services/vite/helpers/config/baseConfig.js';
import type { SkuContext } from '#src/context/createSkuContext.js';
import {
  createOutDir,
  renderEntryChunkName,
} from '#src/services/vite/helpers/bundleConfig.js';
import { createRequire } from 'node:module';
import { middlewarePlugin } from '#src/services/vite/plugins/middlewarePlugin.js';
import { startTelemetryPlugin } from '#src/services/vite/plugins/startTelemetry.js';
import { HMRTelemetryPlugin } from '#src/services/vite/plugins/HMRTelemetry.js';
import { httpsDevServerPlugin } from '#src/services/vite/plugins/httpsDevServerPlugin.js';
import { getAppHosts } from '#src/utils/contextUtils/hosts.js';
import isCI from '#src/utils/isCI.js';

const require = createRequire(import.meta.url);

const clientEntry = require.resolve('../../entries/vite-client.js');

const shouldOpenTab = process.env.OPEN_TAB !== 'false' && !isCI;

export const createServerBuildConfig = (skuContext: SkuContext) => {
  const outDir = createOutDir(skuContext.paths.target);
  return createSkuViteConfig(
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
};

export const createClientBuildConfig = (skuContext: SkuContext) => {
  const outDir = createOutDir(skuContext.paths.target);
  return createSkuViteConfig(
    {
      build: {
        ssr: false,
        outDir: outDir.client,
        manifest: true,
        sourcemap: skuContext.sourceMapsProd,
        rollupOptions: {
          input: clientEntry,
        },
      },
    },
    skuContext,
  );
};

export const createStartConfig = (skuContext: SkuContext) => {
  const outDir = createOutDir(skuContext.paths.target);
  return createSkuViteConfig(
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
        open: shouldOpenTab && (skuContext.initialPath || true),
      },
    },
    skuContext,
  );
};
