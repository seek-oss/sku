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
  const base = import.meta.env.BASE_URL;
  const assets: RenderAssets = {
    bootstrapModules: [path.posix.join(base, entry.file)],
    css: [],
    modulePreloads: [],
  };

  return listen({
    port: Number(process.env.PORT) || Number(import.meta.env.SKU_SSR_PORT),
    base,
    middleware,
    render,
    assets,
    clientDirectory,
    manifest: { manifest, base, entry },
    languages: JSON.parse(
      String(import.meta.env.SKU_LANGUAGES ?? '[]'),
    ) as string[],
    cspEnabled: import.meta.env.SKU_CSP_ENABLED === 'true',
    cspExtraScriptSrcHosts: JSON.parse(
      String(import.meta.env.SKU_CSP_EXTRA_SCRIPT_SRC_HOSTS ?? '[]'),
    ) as string[],
    cspReportOnlyEnabled:
      import.meta.env.SKU_CSP_REPORT_ONLY_ENABLED === 'true',
    cspReportOnlyExtraScriptSrcHosts: JSON.parse(
      String(
        import.meta.env.SKU_CSP_REPORT_ONLY_EXTRA_SCRIPT_SRC_HOSTS ?? '[]',
      ),
    ) as string[],
    cspReportOnlyReportTo:
      String(import.meta.env.SKU_CSP_REPORT_ONLY_REPORT_TO ?? '') || undefined,
  });
};
