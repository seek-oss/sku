import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findEntryChunk, type ClientManifest } from './resolveAssets.js';
import {
  listen,
  type RenderFunction,
  type SsrServerResult,
} from './ssrServerShared.js';
import type { RenderAssets, SkuSsrMiddleware } from './types.js';

export const startProductionSsrServer = async ({
  middleware,
  render,
}: {
  middleware: SkuSsrMiddleware;
  render: RenderFunction;
}): Promise<SsrServerResult> => {
  const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
  const clientDirectory = path.resolve(serverDirectory, '..', 'client');
  const manifest = JSON.parse(
    await readFile(
      path.join(clientDirectory, '.vite', 'manifest.json'),
      'utf8',
    ),
  ) as ClientManifest;
  const entry = findEntryChunk(manifest);
  const publicPath = __SKU_PUBLIC_PATH__;
  const assets: RenderAssets = {
    bootstrapModules: [path.posix.join(publicPath, entry.file)],
    css: [],
    modulePreloads: [],
  };

  const csp = __SKU_CSP__;

  return listen({
    port: Number(process.env.PORT) || Number(__SKU_DEFAULT_SERVER_PORT__),
    publicPath,
    middleware,
    render,
    assets,
    clientDirectory,
    manifest: { manifest, publicPath, entry },
    cspEnabled: csp.enabled,
    cspExtraScriptSrcHosts: csp.extraHosts,
    cspReportOnlyEnabled: csp.reportOnlyEnabled ?? false,
    cspReportOnlyExtraScriptSrcHosts: csp.reportOnlyExtraHosts ?? [],
    cspReportOnlyReportTo: csp.reportOnlyReportTo,
  });
};
