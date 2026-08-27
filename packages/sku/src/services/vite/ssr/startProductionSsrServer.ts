import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import exists from '../../../utils/exists.js';
import { CLIENT_MANIFEST_RELATIVE_PATH } from './clientManifestPath.js';
import {
  findEntryChunk,
  joinPublicPath,
  type ClientManifest,
} from './resolveAssets.js';
import {
  listen,
  type RenderFunction,
  type SsrServerResult,
} from './ssrServerShared.js';
import type { RenderAssets, SkuMiddleware, SkuOnListen } from './types.js';

export const startProductionSsrServer = async ({
  middleware,
  onListen,
  render,
}: {
  middleware?: SkuMiddleware;
  onListen?: SkuOnListen;
  render: RenderFunction;
}): Promise<SsrServerResult> => {
  const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
  const bakedManifestPath = path.join(
    serverDirectory,
    CLIENT_MANIFEST_RELATIVE_PATH,
  );
  const manifest = JSON.parse(
    await readFile(bakedManifestPath, 'utf8'),
  ) as ClientManifest;
  const entry = findEntryChunk(manifest);
  const publicPath = __SKU_PUBLIC_PATH__;
  const assets: RenderAssets = {
    bootstrapModules: [joinPublicPath(publicPath, entry.file)],
    css: [],
    modulePreloads: [],
  };

  const siblingClientDirectory = path.resolve(serverDirectory, '..', 'client');
  const clientDirectory = (await exists(siblingClientDirectory))
    ? siblingClientDirectory
    : undefined;

  const csp = __SKU_CSP__;

  return listen({
    port: Number(process.env.PORT) || Number(__SKU_DEFAULT_SERVER_PORT__),
    publicPath,
    middleware,
    onListen,
    expressTrustProxy: __SKU_EXPRESS_TRUST_PROXY__,
    render,
    assets,
    clientDirectory,
    manifest: { manifest, publicPath, entry },
    cspEnabled: csp.enabled,
    cspExtraScriptSrcHosts: csp.extraHosts,
    cspReportTo: csp.reportTo,
    cspReportOnlyEnabled: csp.reportOnlyEnabled ?? false,
    cspReportOnlyExtraScriptSrcHosts: csp.reportOnlyExtraHosts ?? [],
    cspReportOnlyReportTo: csp.reportOnlyReportTo,
  });
};
