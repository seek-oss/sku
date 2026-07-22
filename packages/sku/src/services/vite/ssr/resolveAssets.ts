import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export interface ManifestChunk {
  file: string;
  name?: string;
  css?: string[];
  imports?: string[];
  dynamicImports?: string[];
  isEntry?: boolean;
  src?: string;
}

export type ClientManifest = Record<string, ManifestChunk>;

const joinPublicPath = (publicPath: string, file: string) =>
  `${publicPath.endsWith('/') ? publicPath : `${publicPath}/`}${file}`;

/** Source-path shaped ids (cwd-relative), not vocab chunk names like `en-translations`. */
const isPathLikeModuleId = (moduleId: string) =>
  moduleId.includes('/') || /\.[cm]?[jt]sx?$/.test(moduleId);

export const warnUnknownModuleId = (moduleId: string) => {
  console.warn(
    `[sku] Unknown route handle.moduleId "${moduleId}" — not found in the Vite client manifest. Production modulepreloads for this route will be skipped.`,
  );
};

/**
 * In development without a client manifest, warn when path-like moduleIds
 * do not resolve to an on-disk file (same key shape as auto-derive).
 * Vocab chunk names are skipped — they only exist in the build manifest.
 */
export const warnUnknownModuleIdsWithoutManifest = (
  moduleIds: string[],
  { cwd = process.cwd() }: { cwd?: string } = {},
) => {
  for (const moduleId of moduleIds) {
    if (!isPathLikeModuleId(moduleId)) {
      continue;
    }
    if (!existsSync(resolve(cwd, moduleId))) {
      warnUnknownModuleId(moduleId);
    }
  }
};

export const findEntryChunk = (manifest: ClientManifest) => {
  const entry = Object.values(manifest).find((chunk) => chunk.isEntry);
  if (!entry) {
    throw new Error('No entry chunk found in the Vite client manifest.');
  }
  return entry;
};

/** Resolve a manifest entry by key or by chunk `name` (e.g. `en-translations`). */
export const findManifestChunk = (
  manifest: ClientManifest,
  keyOrName: string,
): ManifestChunk | undefined =>
  manifest[keyOrName] ??
  Object.values(manifest).find((chunk) => chunk.name === keyOrName);

export const resolveAssets = ({
  manifest,
  publicPath,
  entry,
  moduleIds = [],
  development = false,
}: {
  manifest: ClientManifest;
  publicPath: string;
  entry: ManifestChunk;
  moduleIds?: string[];
  development?: boolean;
}) => {
  const css = new Set<string>();
  const modulePreloads = new Set<string>();
  const seen = new Set<string>();

  const visit = (key: string) => {
    if (seen.has(key)) {
      return;
    }
    seen.add(key);

    const chunk = findManifestChunk(manifest, key);
    if (!chunk) {
      if (development) {
        warnUnknownModuleId(key);
      }
      return;
    }

    if (chunk.file.endsWith('.css')) {
      css.add(joinPublicPath(publicPath, chunk.file));
    } else if (chunk.file !== entry.file) {
      modulePreloads.add(joinPublicPath(publicPath, chunk.file));
    }

    chunk.css?.forEach((file) => css.add(joinPublicPath(publicPath, file)));
    chunk.imports?.forEach(visit);
  };

  entry.css?.forEach((file) => css.add(joinPublicPath(publicPath, file)));
  entry.imports?.forEach(visit);
  moduleIds.forEach(visit);

  return {
    css: [...css],
    modulePreloads: [...modulePreloads],
  };
};
